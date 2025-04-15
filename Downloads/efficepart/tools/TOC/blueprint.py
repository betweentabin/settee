#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
from flask import Blueprint, render_template, request, jsonify, url_for, redirect, send_from_directory, current_app
from werkzeug.utils import secure_filename

# 現在のディレクトリと親ディレクトリをPythonパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.insert(0, parent_dir)

# お知らせ用のログ設定
import logging
logging.getLogger(__name__).info("TOC blueprint imported")

# Standard library imports
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

# テンプレートとスタティックファイルのパスを設定
tool_template_dir = os.path.join(current_dir, 'templates')
static_dir = os.path.join(current_dir, 'static')

# Blueprintの作成
toc_bp = Blueprint('toc', __name__, 
                  template_folder=tool_template_dir,
                  static_folder=static_dir,
                  url_prefix='/toc')

# ファイルアップロード設定
UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# アップロードフォルダが存在しない場合は作成
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ルートエンドポイント
@toc_bp.route('/')
def index():
    return render_template('TOC_index.html')

# TOC＿メインスクリプトを提供するルート
@toc_bp.route('/TOC_main')
def TOC_main():
    return send_from_directory(os.path.join(current_dir, 'static', 'js'), 'TOC＿main.js', mimetype='application/javascript')

# どのパスにアクセスしてもTOC_index.htmlを表示
@toc_bp.route('/<path:path>')
def catch_all(path):
    return render_template('TOC_index.html')

# アップロード処理用のエンドポイント
@toc_bp.route('/upload', methods=['POST'])
def upload_file():
    try:
        current_app.logger.info("Upload endpoint called")
        current_app.logger.info(f"Request method: {request.method}")
        current_app.logger.info(f"Request files: {request.files}")
        current_app.logger.info(f"Request form: {request.form}")
        current_app.logger.info(f"Request headers: {request.headers}")
        current_app.logger.info(f"Request URL: {request.url}")
        current_app.logger.info(f"Request path: {request.path}")
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
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        
        # ファイルを保存
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
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
        current_app.logger.error(f"Error in upload_file: {str(e)}")
        current_app.logger.error(f"Traceback: {error_traceback}")
        return jsonify({
            'success': False, 
            'error': f'エラーが発生しました: {str(e)}',
            'traceback': error_traceback
        }), 500 