#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ダッシュボードアプリケーション
ポート8000で実行され、すべてのツールへのリンクを提供します。
"""

import os
import sys
from pathlib import Path

# カレントディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
# 親ディレクトリをsys.pathに追加
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# 環境変数ロード
from dotenv import load_dotenv
load_dotenv()

# モジュールリゾルバをインポート
try:
    import module_resolver
except ImportError:
    print("モジュールリゾルバをインポートできませんでした。")

# Flask関連インポート
from flask import Flask, render_template, redirect, url_for, jsonify, request

# Blueprint設定をインポート
try:
    from tools.blueprint_config import BLUEPRINT_PORTS, BLUEPRINT_NAMES, BLUEPRINT_PATHS
except ImportError:
    print("Blueprint設定をインポートできません。")
    sys.exit(1)

# Flaskアプリケーション作成
app = Flask(__name__, 
            template_folder=os.path.join(current_dir, 'templates'),
            static_folder=os.path.join(current_dir, 'static'))

# 設定
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(32))
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Blueprint情報の取得
def get_blueprint_info():
    """利用可能なBlueprintの情報を取得"""
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

# ルート：ダッシュボード
@app.route('/')
def index():
    """ダッシュボードを表示"""
    blueprints = get_blueprint_info()
    return render_template('pages/dashboard.html', blueprints=blueprints)

# API：Blueprint情報
@app.route('/api/blueprints')
def get_blueprints():
    """Blueprint情報をJSON形式で返す"""
    blueprints = get_blueprint_info()
    return jsonify(blueprints)

# ヘルスチェック用エンドポイント
@app.route('/health')
def health_check():
    """サーバーの状態を確認するためのエンドポイント"""
    return jsonify({'status': 'healthy', 'message': 'ダッシュボードサーバーは正常に動作しています'})

# 404エラーハンドリング
@app.errorhandler(404)
def page_not_found(e):
    """404エラーページを表示"""
    return render_template('errors/404.html'), 404

# メイン実行部分
if __name__ == '__main__':
    PORT = int(os.environ.get('DASHBOARD_PORT', 8000))
    print(f"ダッシュボードをポート{PORT}で起動します...")
    print(f"アクセスURL: http://localhost:{PORT}/")
    app.run(host='0.0.0.0', port=PORT, debug=True) 