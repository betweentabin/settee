#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
すべてのBlueprintをメインアプリケーションと一緒に一括起動するシンプルなスクリプト。
使用法: python run_with_blueprints.py
"""

import os
import sys
import subprocess
import time
import signal
import threading
import socket

# カレントディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
# 親ディレクトリをsys.pathに追加
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# 環境変数ロード
from dotenv import load_dotenv
load_dotenv()

# Blueprint設定をインポート
try:
    from tools.blueprint_config import BLUEPRINT_PORTS, BLUEPRINT_NAMES, BLUEPRINT_PATHS
except ImportError:
    print("Blueprint設定をインポートできません")
    sys.exit(1)

from tools.TOC.blueprint import toc_bp
from tools.pdf.blueprint import pdf_bp
from tools.shift.blueprint import shift_bp
from tools.nametag_generator.blueprint import nametag_bp
from tools.transfer.blueprint import transfer_bp
from tools.gigafile.blueprint import gigafile_bp
from tools.converter.main import converter_bp

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

def kill_process_on_port(port):
    """指定されたポートで実行中のプロセスを終了"""
    if sys.platform.startswith('win'):
        # Windowsの場合
        cmd = f"FOR /F \"tokens=5\" %a in ('netstat -ano ^| findstr :{port}') do TaskKill /F /PID %a"
        os.system(cmd)
    else:
        # MacやLinuxの場合
        cmd = f"lsof -i tcp:{port} | grep LISTEN | awk '{{print $2}}' | xargs -r kill -9"
        os.system(cmd)

def start_app():
    """メインアプリケーションを起動"""
    port = BLUEPRINT_PORTS['main']
    
    # ポートが既に使用されているか確認し、使用されていれば終了
    if is_port_open(port):
        print(f"ポート{port}は既に使用されています。既存のプロセスを終了します...")
        kill_process_on_port(port)
        time.sleep(1)  # プロセス終了待機
    
    print(f"メインアプリケーションをポート{port}で起動します...")
    
    # app.pyを起動
    app_path = os.path.join(current_dir, 'app.py')
    process = subprocess.Popen([sys.executable, app_path])
    processes.append(('main', process, port))
    
    # 起動完了まで少し待機
    for _ in range(5):  # 5秒間試行
        time.sleep(1)
        if is_port_open(port):
            print(f"✅ メインアプリケーションが起動しました！ アクセスURL: http://localhost:{port}/")
            print(f"以下のURLでそれぞれのツールにアクセスできます:")
            for name, display_name in BLUEPRINT_NAMES.items():
                if name != 'main':
                    path = BLUEPRINT_PATHS.get(name, f"/{name}")
                    print(f"- {display_name}: http://localhost:{port}{path}")
            return True
    
    print(f"⚠️ メインアプリケーションの起動に時間がかかっています...")
    return True

def signal_handler(sig, frame):
    """シグナルハンドラー（Ctrl+C）"""
    print("\n\n終了処理を開始しています...")
    for name, process, port in processes:
        if process.poll() is None:  # プロセスが実行中なら
            display_name = BLUEPRINT_NAMES.get(name, name)
            print(f"{display_name}を停止中...")
            process.terminate()
    
    # すべてのプロセスが終了するのを待つ
    for name, process, port in processes:
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            display_name = BLUEPRINT_NAMES.get(name, name)
            print(f"{display_name}が応答しないため強制終了します...")
            process.kill()
    
    print("\nすべてのBlueprintが停止されました。お疲れ様でした！")
    sys.exit(0)

def wait_for_input():
    """ユーザー入力待機（Ctrl+Cで終了）"""
    try:
        print("\nアプリケーションが実行中です。終了するには Ctrl+C を押してください...")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    # シグナルハンドラを設定
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("\n=== Webツールスイート - 一括起動スクリプト ===")
    
    # メインアプリケーションを起動
    started = start_app()
    
    if started:
        wait_for_input()
    else:
        print("起動に失敗しました。")
        sys.exit(1) 