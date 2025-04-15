#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import json
import logging
import traceback
from datetime import datetime

# ログ設定
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# ログファイルのパス設定
log_file = os.path.join(log_dir, 'wsgi_app.log')

# ロガーの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='a', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('wsgi_app')

# 現在のディレクトリをPATHに追加
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, current_dir)

# アプリケーションのインポート
try:
    from app import app as application
    logger.info("Flaskアプリケーションを正常にインポートしました")
    
    def main():
        """
        WSGIアプリケーションのエントリーポイント
        CGIから呼び出される
        """
        # リクエスト情報のログ記録
        logger.info(f"リクエスト受信: {datetime.now().isoformat()}")
        
        # レスポンスの作成
        try:
            # 環境変数の設定
            os.environ['FLASK_ENV'] = 'production'
            
            # リクエストパラメータの取得
            if len(sys.argv) > 1:
                request_file = sys.argv[1]
                logger.info(f"リクエストファイル: {request_file}")
                
                if os.path.exists(request_file):
                    with open(request_file, 'r') as f:
                        try:
                            params = json.load(f)
                            logger.info(f"リクエストパラメータ: {json.dumps(params)}")
                            
                            # ルートパスの処理
                            path = params.get('path', '/')
                            logger.info(f"リクエストパス: {path}")
                            
                            # 簡易的なWSGIリクエスト処理
                            # 実際のリクエストはFlaskで処理する必要があります
                            if path == '/':
                                # ルートパスの場合はindex.htmlを返す
                                index_path = os.path.join(current_dir, 'index.html')
                                logger.info(f"インデックスパス: {index_path}")
                                
                                if os.path.exists(index_path):
                                    with open(index_path, 'r', encoding='utf-8') as index_file:
                                        content = index_file.read()
                                    logger.info("インデックスHTMLを返します")
                                    print(content)
                                    return
                                else:
                                    logger.warning(f"インデックスファイルが見つかりません: {index_path}")
                            
                            # その他のパスは対応するHTMLファイルを返す
                            path = path.lstrip('/')
                            file_path = os.path.join(current_dir, path)
                            logger.info(f"ファイルパス: {file_path}")
                            
                            if os.path.exists(file_path):
                                with open(file_path, 'r', encoding='utf-8') as html_file:
                                    content = html_file.read()
                                logger.info(f"ファイルを返します: {file_path}")
                                print(content)
                                return
                            else:
                                logger.warning(f"ファイルが見つかりません: {file_path}")
                            
                            # ファイルが見つからない場合は404エラー
                            error_response = {
                                'status': 'error',
                                'message': 'Page not found',
                                'code': 404
                            }
                            logger.error(f"404エラー: {path}")
                            print(json.dumps(error_response))
                            
                        except json.JSONDecodeError as e:
                            logger.error(f"JSONデコードエラー: {str(e)}")
                            error_response = {
                                'status': 'error',
                                'message': '無効なJSONデータです',
                                'code': 400
                            }
                            print(json.dumps(error_response))
                else:
                    logger.error(f"リクエストファイルが見つかりません: {request_file}")
                    error_response = {
                        'status': 'error',
                        'message': 'リクエストファイルが見つかりません',
                        'code': 400
                    }
                    print(json.dumps(error_response))
            else:
                logger.error("リクエストパラメータが不足しています")
                error_response = {
                    'status': 'error',
                    'message': 'リクエストパラメータが不足しています',
                    'code': 400
                }
                print(json.dumps(error_response))
                
        except Exception as e:
            logger.error(f"予期せぬエラー: {str(e)}")
            logger.error(traceback.format_exc())
            error_response = {
                'status': 'error',
                'message': str(e),
                'code': 500
            }
            print(json.dumps(error_response))
    
except ImportError as e:
    logger.error(f"アプリケーションのインポートに失敗: {str(e)}")
    logger.error(traceback.format_exc())
    
    def main():
        error_response = {
            'status': 'error',
            'message': f'アプリケーションのインポートに失敗しました: {str(e)}',
            'code': 500
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    try:
        logger.info("WSGIアプリケーション実行開始")
        main()
        logger.info("WSGIアプリケーション実行終了")
    except Exception as e:
        logger.critical(f"アプリケーション実行中の重大なエラー: {str(e)}")
        logger.critical(traceback.format_exc())
        print(json.dumps({
            'status': 'error',
            'message': f'クリティカルエラー: {str(e)}',
            'code': 500
        }))