#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import shutil

# Import the module resolver to ensure all dependencies are accessible
import module_resolver
# module_resolverは自動的に初期化されるため、明示的に初期化する必要はありません

# Standard library imports
import logging
import importlib.util
from pathlib import Path
import secrets
import re

# Third-party imports
from flask import Flask, render_template, redirect, url_for, request, session, Response, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.serving import run_simple
from dotenv import load_dotenv
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from cryptography.fernet import Fernet
from werkzeug.utils import secure_filename

# Blueprint imports
from tools.TOC.blueprint import toc_bp
from tools.pdf.blueprint import pdf_bp
from tools.shift.blueprint import shift_bp
from tools.nametag_generator.blueprint import nametag_bp
from tools.transfer.blueprint import transfer_bp
from tools.gigafile.blueprint import gigafile_bp
from tools.converter.main import converter_bp

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log', mode='a', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Create the main Flask app
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(32))
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'  # 本番環境ではTrueに設定
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # セッションのタイムアウトを30分に設定

# セキュリティ強化：CSRF保護の初期化
csrf = CSRFProtect(app)

# セキュリティ強化：レート制限の設定
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# CORSポリシーの適用（必要最小限のオリジンのみ許可）
CORS(app, resources={r"/*": {"origins": "*"}})  # 本番環境では特定のオリジンのみに制限すべき

# Blueprintの登録
app.register_blueprint(toc_bp)
app.register_blueprint(pdf_bp)
app.register_blueprint(shift_bp)
# 名札ツールのBlueprintを修正
# nametag_generatorの代わりにnametagフォルダのテンプレートを使用するように設定
app.register_blueprint(nametag_bp, template_folder='tools/nametag/templates')
app.register_blueprint(transfer_bp)
app.register_blueprint(gigafile_bp)
app.register_blueprint(converter_bp)

# 暗号化用の関数
def setup_encryption():
    """暗号化キーのセットアップ"""
    encryption_key = os.environ.get('ENCRYPTION_KEY')
    if not encryption_key:
        # 初回実行時のみキーを生成し、.envファイルに保存する
        encryption_key = Fernet.generate_key().decode()
        with open('.env', 'a') as f:
            f.write(f'\nENCRYPTION_KEY={encryption_key}')
    return Fernet(encryption_key.encode())

# 暗号化インスタンスの初期化
cipher_suite = setup_encryption()

def encrypt_data(data):
    """文字列データを暗号化"""
    if isinstance(data, str):
        data = data.encode()
    return cipher_suite.encrypt(data)

def decrypt_data(encrypted_data):
    """暗号化されたデータを復号"""
    return cipher_suite.decrypt(encrypted_data).decode()

# セキュアなファイル名生成関数
def secure_filename(filename):
    """
    安全なファイル名を生成する。
    元のファイル名から拡張子を保持し、本体は安全なランダム文字列に置き換える。
    """
    if not filename:
        return None
    # 拡張子部分を取得
    ext = os.path.splitext(filename)[1].lower()
    # 許可された拡張子のみ許可
    allowed_extensions = ['.pdf', '.txt', '.csv', '.xlsx', '.docx', '.pptx']
    if ext not in allowed_extensions:
        return None
    # 安全なランダム文字列を生成
    safe_part = secrets.token_hex(16)
    return f"{safe_part}{ext}"

# アップロードされたファイルのバリデーション
def validate_pdf_file(file):
    """
    アップロードされたファイルが本当にPDFファイルかチェックする。
    """
    if not file or not file.filename.lower().endswith('.pdf'):
        return False
    
    # ファイルの先頭バイトをチェック（PDFマジックナンバー）
    try:
        header = file.read(5)
        file.seek(0)  # ポインタを戻す
        return header == b'%PDF-'
    except:
        return False

# セキュリティヘッダーの追加
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'"
    if app.config['SESSION_COOKIE_SECURE']:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Project root directory
project_root = Path(__file__).parent.absolute()
tools_dir = project_root / 'tools'

# Blueprint情報の取得
def get_blueprint_info():
    """利用可能なBlueprintの情報を取得"""
    from tools.blueprint_config import BLUEPRINT_PORTS, BLUEPRINT_PATHS, BLUEPRINT_NAMES
    blueprints = []
    for name, display_name in BLUEPRINT_NAMES.items():
        if name in BLUEPRINT_PORTS:
            port = BLUEPRINT_PORTS[name]
            path = BLUEPRINT_PATHS.get(name, f"/{name}")
            url = f"http://localhost:{port}{path}"
            blueprints.append({
                'name': name,
                'display_name': display_name,
                'port': port,
                'url': url
            })
    return blueprints

# Root route
@app.route('/')
def index():
    """ダッシュボードページまたはインデックスページを表示"""
    # 静的なindex.htmlが存在する場合はそれを使用
    static_index_path = os.path.join(app.root_path, 'index.html')
    if os.path.exists(static_index_path):
        with open(static_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return Response(content, mimetype='text/html')
    
    # Blueprintの情報を取得
    blueprints = get_blueprint_info()
    
    # テンプレートが存在するか確認
    if os.path.exists(os.path.join(app.template_folder, 'pages', 'index.html')):
        return render_template('pages/index.html')
    else:
        # 存在しない場合はダッシュボードを表示
        return render_template('pages/dashboard.html', blueprints=blueprints)

# どのパスにアクセスしてもindex.htmlを表示するようにする
@app.route('/<path:path>')
def catch_all(path):
    # favicon.icoは除外
    if path == 'favicon.ico':
        return app.send_static_file('favicon.ico')
        
    # Blueprintのパスは除外（Blueprintに処理を委ねる）
    if path.startswith(('toc/', 'pdf/', 'shift/', 'nametag/', 'transfer/', 'gigafile/')):
        return Response('', status=404)  # 404を返すことで、Blueprintに処理を委ねる
    
    # 存在しないパスに対して404を返す
    if not os.path.exists(os.path.join(app.static_folder, path)) and not os.path.exists(os.path.join(app.template_folder, path)):
        return page_not_found(Exception(f"Path {path} not found"))
    
    return render_template('pages/index.html')

# Favicon route
@app.route('/favicon.ico')
def favicon():
    """Faviconを提供"""
    return app.send_static_file('favicon.ico')

# セキュリティ強化：エラーハンドラー
@app.errorhandler(404)
def page_not_found(e):
    # APIリクエストの場合はJSONを返す
    if request.path.startswith('/api/') or request.headers.get('Accept') == 'application/json':
        return jsonify(error="Not Found", message=str(e)), 404
    # 通常のリクエストの場合はカスタムエラーページを返す
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def server_error(e):
    # エラー詳細をログに記録
    app.logger.error(f"500 Error: {str(e)}")
    
    # APIリクエストの場合はJSONを返す
    if request.path.startswith('/api/') or request.headers.get('Accept') == 'application/json':
        return jsonify(error="Internal Server Error", message=str(e)), 500
        
    # デバッグモードの場合はエラー詳細を表示
    if app.debug:
        return render_template('errors/500_debug.html', error=str(e)), 500
    else:
        return render_template('errors/500.html'), 500

# TOCページ用の特別なルート
@app.route('/toc')
def toc_view():
    """TOCページを表示"""
    # toc/index.htmlが存在する場合は直接それを読み込む
    toc_index_path = os.path.join(app.root_path, 'toc/index.html')
    if os.path.exists(toc_index_path):
        with open(toc_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return Response(content, mimetype='text/html')
    # ファイルが見つからない場合はBlueprintに委ねる
    return redirect(url_for('toc_bp.index'))

# Converterページ用のルート
@app.route('/converter')
def converter_view():
    """Converterページを表示"""
    # converter/index.htmlが存在する場合は直接それを読み込む
    converter_index_path = os.path.join(app.root_path, 'converter/index.html')
    if os.path.exists(converter_index_path):
        with open(converter_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return Response(content, mimetype='text/html')
    # ファイルが見つからない場合はBlueprintに委ねる
    return redirect(url_for('converter_bp.index'))

# PDFページ用のルート
@app.route('/pdf')
def pdf_view():
    """PDFページを表示"""
    # pdf/index.htmlが存在する場合は直接それを読み込む
    pdf_index_path = os.path.join(app.root_path, 'pdf/index.html')
    if os.path.exists(pdf_index_path):
        with open(pdf_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return Response(content, mimetype='text/html')
    # ファイルが見つからない場合はBlueprintに委ねる
    return redirect(url_for('pdf_bp.index'))

# Shiftページ用のルート
@app.route('/shift')
def shift_view():
    """Shiftページを表示"""
    # shift/index.htmlが存在する場合は直接それを読み込む
    shift_index_path = os.path.join(app.root_path, 'shift/index.html')
    if os.path.exists(shift_index_path):
        with open(shift_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return Response(content, mimetype='text/html')
    # ファイルが見つからない場合はBlueprintに委ねる
    return redirect(url_for('shift_bp.index'))

# Gigafileページ用のルート
@app.route('/gigafile')
def gigafile_view():
    """Gigafileページを表示"""
    # gigafile/index.htmlが存在する場合は直接それを読み込む
    gigafile_index_path = os.path.join(app.root_path, 'gigafile/index.html')
    if os.path.exists(gigafile_index_path):
        with open(gigafile_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return Response(content, mimetype='text/html')
    # ファイルが見つからない場合はBlueprintに委ねる
    return redirect(url_for('gigafile_bp.index'))

# 静的ファイルの追加設定
@app.route('/static/css/<path:filename>')
def serve_css(filename):
    # Gigafileのスタイルを特別に処理
    if filename == 'transfer_index.styles.css':
        return send_from_directory(os.path.join(app.root_path, 'tools/gigafile/static/css'), filename)
    # TOCのスタイルを特別に処理
    elif filename == 'toc_index.styles.css':
        if os.path.exists(os.path.join(app.static_folder, 'css', filename)):
            return send_from_directory(os.path.join(app.static_folder, 'css'), filename)
        return send_from_directory(os.path.join(app.root_path, 'tools/TOC/static/css'), filename)
    # tool-contentスタイルを特別に処理
    elif filename == 'tool-content.css':
        if os.path.exists(os.path.join(app.static_folder, 'css', filename)):
            return send_from_directory(os.path.join(app.static_folder, 'css'), filename)
        # ファイルが存在しない場合は空のCSSを返す
        return Response('/* Empty CSS */', mimetype='text/css')
    # Converterのスタイルを特別に処理
    elif filename == 'conversion_index.styles.css':
        if os.path.exists(os.path.join(app.static_folder, 'css', filename)):
            return send_from_directory(os.path.join(app.static_folder, 'css'), filename)
        return send_from_directory(os.path.join(app.root_path, 'tools/converter/static/css'), filename)
    return app.send_static_file(os.path.join('css', filename))

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    # Gigafileのスクリプトを特別に処理
    if filename == 'transfer_index.styles.js' or filename == 'transfer_index.tyles.js':
        return send_from_directory(os.path.join(app.root_path, 'tools/gigafile/static/js'), 'transfer_index.styles.js')
    # TOCのスクリプトを特別に処理
    elif filename == 'toc_unified.js':
        if os.path.exists(os.path.join(app.static_folder, 'js', filename)):
            return send_from_directory(os.path.join(app.static_folder, 'js'), filename)
        # TOC_main.jsを返す
        if os.path.exists(os.path.join(app.static_folder, 'js', 'TOC_main.js')):
            return send_from_directory(os.path.join(app.static_folder, 'js'), 'TOC_main.js')
        return send_from_directory(os.path.join(app.root_path, 'tools/TOC/static/js'), 'TOC_main.js')
    elif filename == 'TOC_main.js':
        if os.path.exists(os.path.join(app.static_folder, 'js', filename)):
            return send_from_directory(os.path.join(app.static_folder, 'js'), filename)
        return send_from_directory(os.path.join(app.root_path, 'tools/TOC/static/js'), filename)
    # Converterのスクリプトを特別に処理
    elif filename == 'conversion_index.js':
        if os.path.exists(os.path.join(app.static_folder, 'js', filename)):
            return send_from_directory(os.path.join(app.static_folder, 'js'), filename)
        return send_from_directory(os.path.join(app.root_path, 'tools/converter/static/js'), 'conversion_index.tyles.js')
    # シフト関連のスクリプトを特別に処理
    elif filename == 'shift_index.js':
        if os.path.exists(os.path.join(app.static_folder, 'js', filename)):
            return send_from_directory(os.path.join(app.static_folder, 'js'), filename)
        if os.path.exists(os.path.join(app.root_path, 'tools/shift/static/js'), filename):
            return send_from_directory(os.path.join(app.root_path, 'tools/shift/static/js'), filename)
        # ファイルが存在しない場合は空のJSを返す
        return Response('// Empty JavaScript', mimetype='application/javascript')
    return app.send_static_file(os.path.join('js', filename))

# efficepart静的ファイルのリダイレクト
@app.route('/efficepart/static/<path:path>')
def serve_efficepart_static(path):
    """efficepart/staticパスを/staticにリダイレクト"""
    app.logger.info(f"efficepart静的ファイルリクエスト: {path}")
    return redirect(f"/static/{path}")

# public_html/efficepart対応のためのルーティング
@app.route('/public_html/efficepart/static/<path:path>')
def serve_public_html_efficepart_static(path):
    """public_html/efficepart/staticパスを/staticにリダイレクト"""
    app.logger.info(f"public_html/efficepart静的ファイルリクエスト: {path}")
    return redirect(f"/static/{path}")

# static直接アクセス用
@app.route('/static/<path:path>')
def serve_static_direct(path):
    """staticパスから直接静的ファイルを提供（書き換え用）"""
    app.logger.info(f"static直接ファイルリクエスト: {path}")
    # 直接ファイルを提供
    if path.startswith('css/'):
        return send_from_directory(os.path.join(app.static_folder, 'css'), path[4:])
    elif path.startswith('js/'):
        return send_from_directory(os.path.join(app.static_folder, 'js'), path[3:])
    elif path.startswith('img/'):
        return send_from_directory(os.path.join(app.static_folder, 'img'), path[4:])
    else:
        return send_from_directory(app.static_folder, path)

# efficepart内のパスへのルーティング
@app.route('/efficepart/<path:path>')
def serve_efficepart_path(path):
    """efficepart/パスへのアクセスを処理"""
    app.logger.info(f"efficepart内パスへのアクセス: {path}")
    # ツールページへのリクエストは直接ルートへリダイレクト
    if path in ['toc', 'pdf', 'shift', 'namecard', 'converter', 'gigafile']:
        return redirect(f"/{path}")
    # API呼び出しは内部的にAPIエンドポイントにリダイレクト
    elif path.startswith('api/'):
        api_path = path[4:]  # 'api/'の部分を削除
        return redirect(f"/api/{api_path}")
    # その他のリクエストはルートパスにリダイレクト
    else:
        return redirect(f"/{path}")

# public_html/efficepart内のパスへのルーティング
@app.route('/public_html/efficepart/<path:path>')
def serve_public_html_efficepart_path(path):
    """public_html/efficepart/パスへのアクセスを/efficepart/にリダイレクト"""
    app.logger.info(f"public_html/efficepart内パスへのアクセス: {path}")
    return redirect(f"/efficepart/{path}")

# efficepart直下へのアクセス
@app.route('/efficepart/')
@app.route('/efficepart')
def serve_efficepart_root():
    """efficepart/へのアクセスをルートパスにリダイレクト"""
    app.logger.info("efficepart直下へのアクセス")
    return redirect("/")

# public_html/efficepart直下へのアクセス
@app.route('/public_html/efficepart/')
@app.route('/public_html/efficepart')
def serve_public_html_efficepart_root():
    """public_html/efficepart/へのアクセスをルートパスにリダイレクト"""
    app.logger.info("public_html/efficepart直下へのアクセス")
    return redirect("/efficepart/")

# シフト生成用リダイレクト
@app.route('/generate', methods=['POST'])
def generate_redirect():
    """古いエンドポイントから新しいAPIエンドポイントにリダイレクト"""
    app.logger.info("シフト生成リダイレクト")
    # POSTデータを新しいエンドポイントに転送
    return redirect('/api/shift/generate', code=307)  # 307はPOSTメソッドを保持する

# メインアプリケーション実行
if __name__ == "__main__":
    # アプリケーションモードに基づいた設定
    debug_mode = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    # ホストとポートの設定
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 8000))
    
    # アプリケーションの実行
    app.run(host=host, port=port, debug=debug_mode)

# シフト生成API
@app.route('/api/shift/generate', methods=['POST'])
def generate_shift():
    """シフト生成APIエンドポイント"""
    app.logger.info("シフト生成APIが呼び出されました")
    app.logger.info(f"Request method: {request.method}")
    app.logger.info(f"Request form: {request.form}")
    
    try:
        # POSTデータを取得
        data = request.form
        app.logger.info(f"受信データ: {data}")
        
        # 処理ロジックを実装
        # ダミーのレスポンス
        result = {
            'success': True,
            'message': 'シフトが正常に生成されました',
            'shifts': [
                {'name': '社員1', 'time': '9:00-10:00'},
                {'name': '社員2', 'time': '10:00-11:00'},
                {'name': '社員3', 'time': '11:00-12:00'}
            ]
        }
        app.logger.info("シフト生成が成功しました")
        return jsonify(result)
    except Exception as e:
        # エラーログを記録
        app.logger.error(f"シフト生成エラー: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        # エラーレスポンスを返す
        return jsonify({
            'success': False, 
            'error': f'エラーが発生しました: {str(e)}'
        }), 500

# TOC生成API
@app.route('/api/toc/generate', methods=['POST'])
def generate_toc_api():
    """目次生成APIエンドポイント"""
    app.logger.info("TOC生成APIが呼び出されました")
    app.logger.info(f"Request method: {request.method}")
    app.logger.info(f"Request files: {request.files}")
    app.logger.info(f"Request form: {request.form}")
    
    # ファイルが送信されているか確認
    if 'file' not in request.files:
        app.logger.warning("ファイルが送信されていません")
        return jsonify({'success': False, 'error': 'ファイルが送信されていません。'}), 400
    
    file = request.files['file']
    
    # ファイル名が空でないか確認
    if file.filename == '':
        app.logger.warning("ファイルが選択されていません")
        return jsonify({'success': False, 'error': 'ファイルが選択されていません。'}), 400
    
    # PPTXファイルか確認
    if not file.filename.lower().endswith('.pptx'):
        # デバッグ用に一時的に.mdファイルも許可
        if not file.filename.lower().endswith('.md'):
            app.logger.warning(f"無効なファイル形式: {file.filename}")
            return jsonify({'success': False, 'error': 'PPTXファイルのみアップロードできます。'}), 400
    
    # アップロードフォルダを設定
    upload_folder = os.path.join(app.root_path, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    
    # ファイルを保存
    filename = secure_filename(file.filename)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    app.logger.info(f"ファイルを保存しました: {filepath}")
    
    try:
        # フォントサイズの取得
        font_sizes = request.form.getlist('toc_font_size[]')
        bold_options = request.form.getlist('toc_bold[]')
        app.logger.info(f"フォントサイズ: {font_sizes}, 太字オプション: {bold_options}")
        
        # ダミーの目次HTMLを生成（実際の処理はここに実装）
        toc_html = f'''
        <div class="toc-result-container">
            <h3>生成された目次</h3>
            <div class="toc-preview">
                <ul class="toc-list">
                    <li class="toc-item"><span class="toc-number">1.</span> <span class="toc-text">はじめに</span></li>
                    <li class="toc-item"><span class="toc-number">2.</span> <span class="toc-text">使用方法</span>
                        <ul>
                            <li class="toc-item"><span class="toc-number">2.1.</span> <span class="toc-text">インストール</span></li>
                            <li class="toc-item"><span class="toc-number">2.2.</span> <span class="toc-text">設定</span></li>
                        </ul>
                    </li>
                    <li class="toc-item"><span class="toc-number">3.</span> <span class="toc-text">機能説明</span></li>
                    <li class="toc-item"><span class="toc-number">4.</span> <span class="toc-text">トラブルシューティング</span></li>
                </ul>
            </div>
            <div class="download-options">
                <button class="download-btn">Word形式でダウンロード</button>
                <button class="download-btn">Excel形式でダウンロード</button>
                <button class="download-btn">PDF形式でダウンロード</button>
            </div>
        </div>
        '''
        
        # 一時ファイルを削除
        if os.path.exists(filepath):
            os.remove(filepath)
            app.logger.info(f"一時ファイルを削除しました: {filepath}")
        
        app.logger.info("目次生成が成功しました")
        return jsonify({
            'success': True, 
            'message': '目次が正常に生成されました。',
            'toc_html': toc_html
        })
    
    except Exception as e:
        # エラーログを記録
        app.logger.error(f"TOC生成エラー: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        # 一時ファイルを削除
        if os.path.exists(filepath):
            os.remove(filepath)
        # エラーレスポンスを返す
        return jsonify({
            'success': False, 
            'error': f'エラーが発生しました: {str(e)}'
        }), 500
