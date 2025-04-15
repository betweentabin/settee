#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
from flask import Flask, render_template, request, jsonify, url_for, redirect, send_from_directory
from werkzeug.utils import secure_filename

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import the module resolver to ensure all dependencies are accessible
import module_resolver

# Set up the TOC tool environment only if running as standalone script
# app.pyからインポートされた場合は既にsetup_tool_environmentが呼ばれているので重複を避ける
if __name__ == "__main__":
    module_resolver.setup_tool_environment('TOC')
else:
    # モジュールとしてインポートされた場合はログだけ出す
    import logging
    logging.getLogger(__name__).info("TOC app imported as a module")

# Standard library imports
import logging
import shutil
import tempfile
import time
from contextlib import contextmanager
from typing import Optional, Tuple
from copy import deepcopy

# Third-party imports
from pptx import Presentation
from pptx.util import Pt, Inches
from pptx.enum.text import MSO_AUTO_SIZE, PP_ALIGN
from flask import Flask, request, render_template, jsonify, send_file, session, url_for
from werkzeug.utils import secure_filename
from flask_cors import CORS

# テンプレートとスタティックファイルのパスを設定
tool_template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates'))
main_template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../templates'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'static'))

# Flaskアプリケーションの作成
app = Flask(__name__, 
           template_folder=tool_template_dir, 
           static_folder=static_dir)

# 複数のテンプレートディレクトリを検索できるようにする
from jinja2 import ChoiceLoader, FileSystemLoader
app.jinja_loader = ChoiceLoader([
    FileSystemLoader(tool_template_dir),
    FileSystemLoader(main_template_dir)
])

# メインアプリケーションと統合する場合のセキュリティ設定
app.config['WTF_CSRF_ENABLED'] = True
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# 静的ファイルのURLプレフィックスを設定
app.static_url_path = '/static/toc'

# 静的ファイルのURLを変更するためのコンテキストプロセッサを追加
@app.context_processor
def override_url_for():
    def _url_for(endpoint, **kwargs):
        if endpoint == 'static':
            # 統合モードでは、メインアプリケーションの静的ファイルパスを使用
            if not app.debug:
                kwargs['filename'] = f"toc/{kwargs['filename']}"
        return url_for(endpoint, **kwargs)
    return dict(url_for=_url_for)

# アプリケーションの設定
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# アップロードフォルダが存在しない場合は作成
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# エラーハンドリングの統一
@app.errorhandler(404)
def page_not_found(e):
    return jsonify(error="Not Found"), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify(error="Internal Server Error"), 500

# ルートエンドポイント
@app.route('/')
def index():
    return render_template('TOC_index.html')

# TOC＿メインスクリプトを提供するルート
@app.route('/TOC_main')
def TOC_main():
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'static', 'js'), 'TOC＿main.js', mimetype='application/javascript')

# どのパスにアクセスしてもTOC_index.htmlを表示
@app.route('/<path:path>')
def catch_all(path):
    return render_template('TOC_index.html')

# アップロード処理用のエンドポイント
@app.route('/upload', methods=['POST'])
@app.route('/toc/upload', methods=['POST'])
def upload_file():
    try:
        app.logger.info("Upload endpoint called")
        app.logger.info(f"Request method: {request.method}")
        app.logger.info(f"Request files: {request.files}")
        app.logger.info(f"Request form: {request.form}")
        app.logger.info(f"Request headers: {request.headers}")
        app.logger.info(f"Request URL: {request.url}")
        app.logger.info(f"Request path: {request.path}")
        # ファイルが送信されているか確認
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'ファイルが送信されていません。'}), 400
        
        file = request.files['file']
        
        # ファイル名が空でないか確認
        if file.filename == '':
            return jsonify({'success': False, 'error': 'ファイルが選択されていません。'}), 400
        
        # PPTXファイルか確認
        if not file.filename.lower().endswith('.pptx'):
            return jsonify({'success': False, 'error': 'PPTXファイルのみアップロードできます。'}), 400
        
        # ディレクトリが存在しない場合は作成
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        
        # ファイルを保存
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # フォントサイズの取得
        font_sizes = request.form.getlist('toc_font_size[]')
        bold_options = request.form.getlist('toc_bold[]')
        
        # 目次生成処理（ダミー処理）
        # 実際の目次生成処理はここに実装します
        
        # ダミーの目次HTMLを生成
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
                <a href="#" class="download-btn">Word形式でダウンロード</a>
                <a href="#" class="download-btn">Excel形式でダウンロード</a>
                <a href="#" class="download-btn">PDF形式でダウンロード</a>
            </div>
        </div>
        '''
        
        # 一時ファイルを削除
        if os.path.exists(filepath):
            os.remove(filepath)
        
        return jsonify({
            'success': True, 
            'message': '目次が正常に生成されました。',
            'toc_html': toc_html
        })
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        app.logger.error(f"Error in upload_file: {str(e)}")
        app.logger.error(f"Traceback: {error_traceback}")
        return jsonify({
            'success': False, 
            'error': f'エラーが発生しました: {str(e)}',
            'traceback': error_traceback
        }), 500

# TOCアプリケーションのメイン機能をここに実装

# スタンドアロンとして実行する場合
if __name__ == "__main__":
    app.run(debug=True, port=5005)
