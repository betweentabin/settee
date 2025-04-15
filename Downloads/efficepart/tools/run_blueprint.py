#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Blueprintを独立して実行するためのスクリプト。
使用法: python run_blueprint.py [blueprint_name]
"""

import os
import sys
import argparse
import importlib
from pathlib import Path

# カレントディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
# 親ディレクトリをsys.pathに追加
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# 環境変数ロード
from dotenv import load_dotenv
load_dotenv(os.path.join(parent_dir, '.env'))

# モジュールリゾルバをインポート
sys.path.append(parent_dir)
try:
    import module_resolver
except ImportError:
    print("モジュールリゾルバをインポートできませんでした。")

# Flask関連インポート
from flask import Flask, render_template, redirect, url_for
from flask_cors import CORS

# Blueprint設定をインポート
try:
    from blueprint_config import BLUEPRINT_PORTS, BLUEPRINT_PATHS, BLUEPRINT_NAMES
except ImportError:
    print("Blueprint設定をインポートできません。カレントディレクトリ:", current_dir)
    print("sys.path:", sys.path)
    sys.exit(1)

def create_blueprint_app(blueprint_name):
    """指定されたBlueprint用のFlaskアプリケーションを作成"""
    try:
        # Blueprintのディレクトリパス
        blueprint_dir = os.path.join(current_dir, blueprint_name)
        if not os.path.exists(blueprint_dir):
            print(f"エラー: ディレクトリ {blueprint_dir} が存在しません。")
            sys.exit(1)
        
        # Blueprintファイルパス
        blueprint_file = os.path.join(blueprint_dir, 'blueprint.py')
        if not os.path.exists(blueprint_file):
            print(f"エラー: ファイル {blueprint_file} が存在しません。")
            sys.exit(1)
        
        # モジュールのパスをしっかり表示
        print(f"Blueprintディレクトリ: {blueprint_dir}")
        print(f"Blueprintファイル: {blueprint_file}")
        
        # Blueprintを直接インポート
        sys.path.insert(0, blueprint_dir)
        
        # Blueprintパスを作成
        import importlib.util
        spec = importlib.util.spec_from_file_location("blueprint", blueprint_file)
        blueprint_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(blueprint_module)
        
        # Blueprintオブジェクトを取得
        blueprint_var_name = f"{blueprint_name.lower()}_bp"
        if hasattr(blueprint_module, blueprint_var_name):
            blueprint = getattr(blueprint_module, blueprint_var_name)
        else:
            print(f"エラー: {blueprint_file} に {blueprint_var_name} が見つかりません。")
            print(f"利用可能な属性: {dir(blueprint_module)}")
            sys.exit(1)
        
        # テンプレートとスタティックファイルのパスを設定
        blueprint_template_dir = os.path.join(blueprint_dir, 'templates')
        blueprint_static_dir = os.path.join(blueprint_dir, 'static')
        
        # Flaskアプリを作成（優先順位: Blueprint内のテンプレート > プロジェクトのテンプレート）
        template_folders = []
        if os.path.exists(blueprint_template_dir):
            template_folders.append(blueprint_template_dir)
        template_folders.append(os.path.join(parent_dir, 'templates'))
        
        static_folders = []
        if os.path.exists(blueprint_static_dir):
            static_folders.append(blueprint_static_dir)
        static_folders.append(os.path.join(parent_dir, 'static'))
        
        app = Flask(__name__, 
                    template_folder=template_folders[0],
                    static_folder=static_folders[0])
        
        # 設定
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(32))
        app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
        app.config['SESSION_COOKIE_HTTPONLY'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
        
        # CORSを設定
        CORS(app)
        
        # Blueprintのパスを取得
        blueprint_path = BLUEPRINT_PATHS.get(blueprint_name.lower(), f"/{blueprint_name.lower()}")
        
        # Blueprintを登録
        print(f"Blueprintを登録: {blueprint}")
        app.register_blueprint(blueprint)
        
        # ルートURLからBlueprintにリダイレクト
        @app.route('/')
        def index():
            print(f"ルートURLにアクセスされました。{blueprint_path}にリダイレクトします")
            return redirect(blueprint_path)
        
        # URLプレフィックスなしでもアクセスできるようにする
        # TOCのルートを直接app.routeでも登録
        if hasattr(blueprint_module, 'index'):
            index_func = getattr(blueprint_module, 'index')
            app.route('/')(index_func)
        
        # Blueprintの他のルートも登録
        for route_name, route_func in [(name, func) for name, func in vars(blueprint_module).items() if callable(func) and hasattr(func, '__name__') and not name.startswith('_')]:
            if hasattr(route_func, 'blueprinted') and route_func.__name__ != 'index':
                route_endpoint = getattr(route_func, 'endpoint', route_func.__name__)
                print(f"ルート関数: {route_name}, エンドポイント: {route_endpoint}")
        
        # 独立スタンドアローンモードであることを示す
        app.config['STANDALONE_MODE'] = True
        app.config['BLUEPRINT_NAME'] = blueprint_name
        app.config['BLUEPRINT_DISPLAY_NAME'] = BLUEPRINT_NAMES.get(blueprint_name.lower(), blueprint_name)
        
        return app
    
    except Exception as e:
        print(f"エラー: {blueprint_name} Blueprintの読み込みに失敗しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def run_blueprint(blueprint_name):
    """指定されたBlueprintを実行"""
    if blueprint_name.lower() not in BLUEPRINT_PORTS and blueprint_name not in BLUEPRINT_PORTS:
        print(f"エラー: '{blueprint_name}' は無効なBlueprintです。")
        print(f"利用可能なBlueprint: {', '.join(BLUEPRINT_PORTS.keys())}")
        sys.exit(1)
    
    key = blueprint_name.lower() if blueprint_name.lower() in BLUEPRINT_PORTS else blueprint_name
    port = BLUEPRINT_PORTS[key]
    app = create_blueprint_app(blueprint_name)
    
    print(f"{blueprint_name} Blueprintをポート {port} で起動中...")
    print(f"アクセスURL: http://localhost:{port}/")
    
    app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='特定のBlueprintを独立して実行します。')
    parser.add_argument('blueprint', help='実行するBlueprintの名前')
    
    args = parser.parse_args()
    run_blueprint(args.blueprint) 