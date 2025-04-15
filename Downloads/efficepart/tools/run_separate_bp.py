#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Blueprintを独立して実行するためのスクリプト。
使用法: python run_separate_bp.py [blueprint_name]
"""

import os
import sys
import argparse
import importlib
import flask
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

def create_app_from_blueprint(blueprint_name):
    """指定されたBlueprintからFlaskアプリケーションを作成"""
    try:
        # Blueprintのディレクトリパス
        blueprint_dir = os.path.join(current_dir, blueprint_name)
        if not os.path.exists(blueprint_dir):
            print(f"エラー: ディレクトリ {blueprint_dir} が存在しません。")
            sys.exit(1)
        
        # Blueprintファイルを直接読み込まずに、そのディレクトリのapp.pyを探す
        app_file = os.path.join(blueprint_dir, f"{blueprint_name}＿app.py")
        if os.path.exists(app_file):
            print(f"アプリケーションファイルを発見: {app_file}")
            
            # アプリケーションモジュールをインポート
            import importlib.util
            spec = importlib.util.spec_from_file_location("app_module", app_file)
            app_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(app_module)
            
            # アプリケーションインスタンスを取得
            if hasattr(app_module, 'app'):
                app = getattr(app_module, 'app')
                print(f"Flaskアプリケーションを発見: {app}")
                return app
            else:
                print(f"エラー: {app_file} にFlaskアプリケーション 'app' が見つかりません。")
                print(f"利用可能な属性: {dir(app_module)}")
                sys.exit(1)
        
        # アプリケーションファイルが見つからない場合、独自のFlaskアプリを作成
        print(f"アプリケーションファイルが見つからないため、新しいFlaskアプリを作成します")
        
        # テンプレートとスタティックディレクトリを設定
        template_dir = os.path.join(blueprint_dir, 'templates')
        static_dir = os.path.join(blueprint_dir, 'static')
        
        # Flaskアプリケーションを作成
        app = Flask(__name__, 
                   template_folder=template_dir if os.path.exists(template_dir) else os.path.join(parent_dir, 'templates'),
                   static_folder=static_dir if os.path.exists(static_dir) else os.path.join(parent_dir, 'static'))
        
        # 設定
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(32))
        app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
        app.config['SESSION_COOKIE_HTTPONLY'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
        
        # アップロードディレクトリを設定
        uploads_dir = os.path.join(blueprint_dir, 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        app.config['UPLOAD_FOLDER'] = uploads_dir
        
        # blueprint.pyを直接読み込み、ハンドラを登録
        blueprint_file = os.path.join(blueprint_dir, 'blueprint.py')
        if os.path.exists(blueprint_file):
            print(f"Blueprintファイルを発見: {blueprint_file}")
            
            # moduleをインポート
            spec = importlib.util.spec_from_file_location("bp_module", blueprint_file)
            bp_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(bp_module)
            
            # ハンドラを探す
            handlers = {}
            for name, obj in vars(bp_module).items():
                if callable(obj) and hasattr(obj, 'endpoint'):
                    route_info = getattr(obj, 'route', '')
                    if route_info:
                        handlers[name] = (obj, route_info)
            
            # 見つからない場合はBlueprintを探す
            blueprint_var_name = f"{blueprint_name.lower()}_bp"
            if hasattr(bp_module, blueprint_var_name):
                blueprint = getattr(bp_module, blueprint_var_name)
                print(f"Blueprintを発見: {blueprint}")
                
                # URLプレフィックスを除去してルートに登録
                url_prefix = blueprint.url_prefix or ''
                
                # Blueprintのルールを抽出
                for rule in blueprint.deferred_functions:
                    if hasattr(rule, '__closure__') and rule.__closure__:
                        for cell in rule.__closure__:
                            if hasattr(cell, 'cell_contents') and isinstance(cell.cell_contents, dict):
                                rule_dict = cell.cell_contents
                                if 'rule' in rule_dict and 'endpoint' in rule_dict:
                                    blueprint_rule = rule_dict['rule']
                                    endpoint = rule_dict['endpoint']
                                    view_func = rule_dict.get('view_func')
                                    
                                    # URLプレフィックスを削除
                                    if blueprint_rule.startswith(url_prefix):
                                        app_rule = blueprint_rule[len(url_prefix):]
                                    else:
                                        app_rule = blueprint_rule
                                    
                                    # '/'で始まるようにする
                                    if not app_rule.startswith('/'):
                                        app_rule = '/' + app_rule
                                    
                                    print(f"ルート登録: {app_rule} -> {endpoint}")
                                    
                                    # TODO: ルートを登録（ただしこれは動作しない可能性があります）
            
            # 最もシンプルな解決策：Blueprintをそのまま登録
            if hasattr(bp_module, blueprint_var_name):
                blueprint = getattr(bp_module, blueprint_var_name)
                app.register_blueprint(blueprint, url_prefix='')
        
        # トップページルートを追加
        @app.route('/')
        def index():
            if os.path.exists(os.path.join(template_dir, f"{blueprint_name}_index.html")):
                return render_template(f"{blueprint_name}_index.html")
            elif os.path.exists(os.path.join(template_dir, "index.html")):
                return render_template("index.html")
            else:
                return f"<h1>{BLUEPRINT_NAMES.get(blueprint_name.lower(), blueprint_name)}</h1><p>独立実行モード</p>"
        
        return app
    
    except Exception as e:
        print(f"エラー: {blueprint_name} アプリケーションの作成に失敗しました: {e}")
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
    app = create_app_from_blueprint(blueprint_name)
    
    print(f"{blueprint_name} アプリケーションをポート {port} で起動中...")
    print(f"アクセスURL: http://localhost:{port}/")
    
    app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='特定のBlueprintを独立したアプリケーションとして実行します。')
    parser.add_argument('blueprint', help='実行するBlueprintの名前')
    
    args = parser.parse_args()
    run_blueprint(args.blueprint) 