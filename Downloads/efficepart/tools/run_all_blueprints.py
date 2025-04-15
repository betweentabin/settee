#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
すべてのBlueprintを並行して実行するスクリプト。
使用法: python run_all_blueprints.py
"""

import os
import sys
import time
import signal
import subprocess
from pathlib import Path
import threading
import traceback
import socket
import argparse

# カレントディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
# 親ディレクトリをsys.pathに追加
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Blueprint設定をインポート
try:
    from blueprint_config import BLUEPRINT_PORTS, BLUEPRINT_NAMES, BLUEPRINT_PATHS
except ImportError:
    print("Blueprint設定をインポートできません。カレントディレクトリ:", current_dir)
    print("sys.path:", sys.path)
    sys.exit(1)

# プロセスリスト
processes = []

def is_port_open(port, host='localhost'):
    """指定したポートが開いているかチェック"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((host, port))
        s.close()
        return True
    except socket.error:
        return False

def run_main_app():
    """メインアプリケーション（app.py）を実行"""
    main_app_path = os.path.join(parent_dir, 'app.py')
    cmd = [sys.executable, main_app_path]
    
    try:
        port = BLUEPRINT_PORTS['main']
        display_name = BLUEPRINT_NAMES.get('main', 'メインアプリケーション')
        blueprint_path = BLUEPRINT_PATHS.get('main', '/')
        print(f"\n🚀 {display_name}をポート{port}で起動中... ({blueprint_path})")
        
        # ポートが既に使用されているか確認
        if is_port_open(port):
            print(f"❌ ポート{port}は既に使用されています。{display_name}の起動をスキップします。")
            return False
        
        # 標準出力と標準エラー出力をファイルにリダイレクト
        log_dir = os.path.join(parent_dir, 'logs')
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "main_app.log")
        
        with open(log_file, 'w') as f:
            process = subprocess.Popen(cmd, stdout=f, stderr=subprocess.STDOUT)
            processes.append(('main', process, port, False))
            
        # 起動完了まで少し待機
        for _ in range(5):  # 5秒間試行
            time.sleep(1)
            if is_port_open(port):
                print(f"✅ {display_name}が起動しました！ アクセスURL: http://localhost:{port}/")
                return True
        
        # 起動に失敗した場合
        print(f"⚠️ {display_name}の起動に時間がかかっています。ログを確認: {log_file}")
        return True
    
    except Exception as e:
        print(f"❌ {display_name}の起動に失敗しました: {e}")
        traceback.print_exc()
        return False

def run_blueprint(blueprint_name, use_separate=True):
    """指定されたBlueprintを別プロセスで実行"""
    # use_separate=Trueの場合は run_separate_bp.py を使用、Falseの場合は run_blueprint.py を使用
    script_name = 'run_separate_bp.py' if use_separate else 'run_blueprint.py'
    script_path = os.path.join(os.path.dirname(__file__), script_name)
    cmd = [sys.executable, script_path, blueprint_name]
    
    try:
        port = BLUEPRINT_PORTS[blueprint_name]
        display_name = BLUEPRINT_NAMES.get(blueprint_name, blueprint_name)
        blueprint_path = BLUEPRINT_PATHS.get(blueprint_name, f"/{blueprint_name}")
        print(f"\n🚀 {display_name}をポート{port}で起動中... ({blueprint_path})")
        
        # ポートが既に使用されているか確認
        if is_port_open(port):
            print(f"❌ ポート{port}は既に使用されています。{display_name}の起動をスキップします。")
            return False
        
        # 標準出力と標準エラー出力をファイルにリダイレクト
        log_dir = os.path.join(parent_dir, 'logs')
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, f"{blueprint_name}.log")
        
        with open(log_file, 'w') as f:
            process = subprocess.Popen(cmd, stdout=f, stderr=subprocess.STDOUT)
            processes.append((blueprint_name, process, port, use_separate))
            
        # 起動完了まで少し待機
        for _ in range(5):  # 5秒間試行
            time.sleep(1)
            if is_port_open(port):
                print(f"✅ {display_name}が起動しました！ アクセスURL: http://localhost:{port}/")
                return True
        
        # 起動に失敗した場合
        print(f"⚠️ {display_name}の起動に時間がかかっています。ログを確認: {log_file}")
        return True
    
    except Exception as e:
        print(f"❌ {blueprint_name}の起動に失敗しました: {e}")
        traceback.print_exc()
        return False

def print_status():
    """実行中のBlueprintの状態を表示"""
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print("\n=== Blueprint状態モニター ===")
        print("名前\t\tポート\tPID\t状態\tURL")
        print("-" * 85)
        
        # プロセスの状態をチェック
        running_count = 0
        for name, process, port, use_separate in processes:
            # プロセスとポートの状態をチェック
            process_status = "実行中" if process.poll() is None else "停止"
            port_status = "開放" if is_port_open(port) else "未開放"
            
            # 総合的な状態を判断
            if process_status == "実行中" and port_status == "開放":
                status = "✅ 正常"
                running_count += 1
            elif process_status == "実行中" and port_status == "未開放":
                status = "⚠️ 起動中"
            else:
                status = "❌ 停止"
                
            display_name = BLUEPRINT_NAMES.get(name, name)
            script_type = "独立アプリ" if use_separate else "Blueprint"
            print(f"{display_name}\t{port}\t{process.pid}\t{status}\thttp://localhost:{port}/ ({script_type})")
        
        print("\n=== サマリー ===")
        print(f"実行中: {running_count}/{len(processes)} Blueprint")
        print(f"ログディレクトリ: {os.path.join(parent_dir, 'logs')}")
        print("\n終了するには Ctrl+C を押してください")
        print("\n次のステータス更新まで10秒...")
        time.sleep(10)

def signal_handler(sig, frame):
    """シグナルハンドラー（Ctrl+C）"""
    print("\n\n終了処理を開始しています...")
    for name, process, port, _ in processes:
        if process.poll() is None:  # プロセスが実行中なら
            display_name = BLUEPRINT_NAMES.get(name, name)
            print(f"{display_name}を停止中...")
            process.terminate()
    
    # すべてのプロセスが終了するのを待つ
    for name, process, port, _ in processes:
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            display_name = BLUEPRINT_NAMES.get(name, name)
            print(f"{display_name}が応答しないため強制終了します...")
            process.kill()
    
    print("\nすべてのBlueprintが停止されました。お疲れ様でした！")
    sys.exit(0)

def confirm_run_all():
    """全てのBlueprintを起動する前に確認"""
    blueprints = list(BLUEPRINT_PORTS.keys())
    print(f"\n起動予定のBlueprint: {len(blueprints)}個")
    for blueprint in blueprints:
        display_name = BLUEPRINT_NAMES.get(blueprint, blueprint)
        port = BLUEPRINT_PORTS[blueprint]
        print(f"- {display_name} (ポート: {port}, URL: http://localhost:{port}/)")
    
    confirmation = input("\nすべてのBlueprintを起動しますか？ [y/n]: ")
    return confirmation.lower() in ['y', 'yes']

if __name__ == "__main__":
    # 引数解析
    parser = argparse.ArgumentParser(description='すべてのBlueprintを並行して実行します。')
    parser.add_argument('--all', action='store_true', help='確認なしですべてのBlueprintを起動')
    parser.add_argument('--use-blueprint', action='store_true', help='run_blueprint.pyを使用(デフォルトはrun_separate_bp.py)')
    parser.add_argument('--blueprints', nargs='+', help='起動するBlueprint名のリスト（指定しない場合はすべて）')
    parser.add_argument('--with-main', action='store_true', help='メインアプリケーションも起動')
    args = parser.parse_args()
    
    # 実行モードとして run_separate_bp.py か run_blueprint.py かを選択
    use_separate = not args.use_blueprint
    script_type = "独立アプリ" if use_separate else "Blueprint"
    
    # シグナルハンドラを設定
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"\n=== Blueprint一覧 ({script_type}モード) ===")
    all_blueprints = list(BLUEPRINT_PORTS.keys())
    # メインアプリケーションは通常のBlueprintリストから除外
    if 'main' in all_blueprints:
        all_blueprints.remove('main')
    
    # メインアプリケーションの情報を表示
    if args.with_main:
        display_name = BLUEPRINT_NAMES.get('main', 'メインアプリケーション')
        port = BLUEPRINT_PORTS['main']
        print(f"- {display_name} (ポート: {port}, URL: http://localhost:{port}/)")
    
    blueprints_to_run = args.blueprints if args.blueprints else all_blueprints
    
    # 指定されたBlueprintが存在するか確認
    invalid_blueprints = [bp for bp in blueprints_to_run if bp.lower() not in [b.lower() for b in all_blueprints]]
    if invalid_blueprints:
        print(f"❌ 指定されたBlueprintが見つかりません: {', '.join(invalid_blueprints)}")
        print(f"有効なBlueprint: {', '.join(all_blueprints)}")
        sys.exit(1)
    
    # 起動するBlueprintを表示
    for blueprint in blueprints_to_run:
        display_name = BLUEPRINT_NAMES.get(blueprint, blueprint)
        port = BLUEPRINT_PORTS[blueprint]
        print(f"- {display_name} (ポート: {port}, URL: http://localhost:{port}/)")
    
    # 確認（--allオプションが指定されている場合はスキップ）
    if not args.all and not confirm_run_all():
        print("処理を中止しました。")
        sys.exit(0)
    
    print("\n=== Blueprint起動中 ===")
    
    # メインアプリケーションを起動（--with-mainオプションが指定されている場合）
    if args.with_main:
        run_main_app()
        time.sleep(2)  # メインアプリケーションの起動後に少し待機
    
    # すべてのBlueprintを起動
    for blueprint in blueprints_to_run:
        run_blueprint(blueprint, use_separate=use_separate)
        time.sleep(1)  # 各Blueprintの起動間に少し待機
    
    if len(processes) == 0:
        print("起動できたBlueprintがありませんでした。")
        sys.exit(1)
    
    print("\nすべてのBlueprintが起動されました。状態モニターを開始します...")
    
    # 状態表示スレッドを開始
    status_thread = threading.Thread(target=print_status)
    status_thread.daemon = True
    status_thread.start()
    
    try:
        # メインスレッドを終了させない
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        # Ctrl+Cで捕捉された場合（念のため）
        signal_handler(signal.SIGINT, None) 