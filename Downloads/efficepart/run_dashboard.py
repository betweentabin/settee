#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ダッシュボードとBlueprintを同時に起動するスクリプト。
使用法: python run_dashboard.py [--no-blueprints]
"""

import os
import sys
import time
import signal
import subprocess
import threading
import argparse

# カレントディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
# 親ディレクトリをsys.pathに追加
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Blueprintの実行関連
if os.path.exists(os.path.join(current_dir, 'tools', 'run_all_blueprints.py')):
    run_all_blueprints_path = os.path.join(current_dir, 'tools', 'run_all_blueprints.py')
else:
    print("警告: tools/run_all_blueprints.py が見つかりません。Blueprintは起動されません。")
    run_all_blueprints_path = None

# ダッシュボードの実行パス
dashboard_path = os.path.join(current_dir, 'dashboard_app.py')

# プロセスリスト
processes = []

def run_dashboard():
    """ダッシュボードを起動"""
    cmd = [sys.executable, dashboard_path]
    
    print(f"🚀 ダッシュボードをポート8000で起動中...")
    
    # ダッシュボードを起動
    process = subprocess.Popen(cmd)
    processes.append(('dashboard', process))
    
    print(f"✅ ダッシュボードが起動しました！ アクセスURL: http://localhost:8000/")
    return True

def run_blueprints():
    """すべてのBlueprintを起動"""
    if not run_all_blueprints_path:
        print("❌ run_all_blueprints.pyが見つからないため、Blueprintは起動されません。")
        return False
    
    # run_all_blueprints.pyを実行（非対話モード）
    cmd = [sys.executable, run_all_blueprints_path, '--all']
    
    print(f"🚀 すべてのBlueprintを起動中...")
    
    # プロセスを起動
    process = subprocess.Popen(cmd)
    processes.append(('blueprints', process))
    
    print(f"✅ Blueprint起動プロセスが開始されました。")
    return True

def signal_handler(sig, frame):
    """シグナルハンドラー（Ctrl+C）"""
    print("\n\n終了処理を開始しています...")
    for name, process in processes:
        if process.poll() is None:  # プロセスが実行中なら
            print(f"{name}を停止中...")
            process.terminate()
    
    # すべてのプロセスが終了するのを待つ
    for name, process in processes:
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print(f"{name}が応答しないため強制終了します...")
            process.kill()
    
    print("\nすべてのプロセスが停止されました。お疲れ様でした！")
    sys.exit(0)

if __name__ == "__main__":
    # 引数解析
    parser = argparse.ArgumentParser(description='ダッシュボードとBlueprintを起動します。')
    parser.add_argument('--no-blueprints', action='store_true', help='Blueprintを起動しない')
    parser.add_argument('--dashboard-only', action='store_true', help='ダッシュボードのみ起動（--no-blueprintsと同じ）')
    args = parser.parse_args()
    
    # シグナルハンドラを設定
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("\n=== ポート8000でのダッシュボード起動 ===")
    
    # ダッシュボードを起動
    success = run_dashboard()
    if not success:
        print("❌ ダッシュボードの起動に失敗しました。")
        sys.exit(1)
    
    # Blueprintを起動（--no-blueprints オプションが指定されていない場合）
    if not args.no_blueprints and not args.dashboard_only:
        success = run_blueprints()
        if not success:
            print("⚠️ Blueprintの起動に問題がありました。ダッシュボードのみ実行を継続します。")
    else:
        print("ℹ️ Blueprintは起動しません（--no-blueprints または --dashboard-only が指定されています）")
    
    print("\n🔍 すべてのプロセスが起動されました。終了するには Ctrl+C を押してください...")
    
    try:
        # メインスレッドを終了させない
        while True:
            time.sleep(1)
            
            # ダッシュボードプロセスが終了していないか確認
            for i, (name, process) in enumerate(processes):
                if process.poll() is not None:  # プロセスが終了した
                    print(f"⚠️ {name}プロセスが終了しました。終了コード: {process.returncode}")
                    # ダッシュボードが終了した場合は全体を終了
                    if name == 'dashboard':
                        print("ダッシュボードが終了したため、すべてのプロセスを停止します...")
                        signal_handler(signal.SIGTERM, None)
    
    except KeyboardInterrupt:
        # Ctrl+Cで捕捉された場合
        signal_handler(signal.SIGINT, None) 