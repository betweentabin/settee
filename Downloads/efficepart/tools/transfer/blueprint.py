#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import uuid
import json
import shutil
from datetime import datetime, timedelta

# 現在のディレクトリと親ディレクトリをPythonパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.insert(0, parent_dir)

# お知らせ用のログ設定
import logging
logging.getLogger(__name__).info("Transfer blueprint imported")

# サードパーティライブラリのインポート
from flask import Blueprint, request, render_template, jsonify, send_from_directory, current_app, g
import magic

# テンプレートとスタティックファイルのパスを設定
template_dir = os.path.join(current_dir, 'templates')
static_dir = os.path.join(current_dir, 'static')

# Blueprintの作成
transfer_bp = Blueprint('transfer', __name__, 
                       template_folder=template_dir,
                       static_folder=static_dir,
                       url_prefix='/transfer')

# アップロード先のディレクトリを設定
UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 設定
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB
FILE_RETENTION_DAYS = 7  # ファイル保持期間（日数）
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z'}

# メタデータを保存するJSONファイルパス
METADATA_FILE = os.path.join(UPLOAD_FOLDER, 'metadata.json')

def allowed_file(filename):
    """許可されたファイル拡張子かどうかを確認"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_metadata():
    """メタデータJSONファイルからデータを読み込む"""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def save_file_metadata(metadata):
    """メタデータをJSONファイルに保存"""
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

def clean_old_files():
    """期限切れのファイルを削除"""
    metadata = get_file_metadata()
    current_time = datetime.now()
    files_to_delete = []
    
    for file_id, file_info in list(metadata.items()):
        upload_time = datetime.fromisoformat(file_info['upload_time'])
        expiration_time = upload_time + timedelta(days=FILE_RETENTION_DAYS)
        
        if current_time > expiration_time:
            file_path = os.path.join(UPLOAD_FOLDER, file_info['filename'])
            if os.path.exists(file_path):
                os.remove(file_path)
            files_to_delete.append(file_id)
    
    # メタデータから削除したファイルを削除
    for file_id in files_to_delete:
        del metadata[file_id]
    
    # 更新されたメタデータを保存
    save_file_metadata(metadata)

@transfer_bp.before_request
def before_request():
    """リクエスト前に古いファイルをクリーンアップ"""
    clean_old_files()

@transfer_bp.route('/')
def index():
    """ファイル転送ツールのメインページを表示"""
    return render_template('pages/transfer_index.html')

@transfer_bp.route('/upload', methods=['POST'])
def upload_file():
    """ファイルをアップロードする"""
    # ファイルがリクエストにあるか確認
    if 'file' not in request.files:
        return jsonify({'error': 'ファイルがアップロードされていません'}), 400
    
    file = request.files['file']
    
    # ファイル名が空でないか確認
    if file.filename == '':
        return jsonify({'error': 'ファイルが選択されていません'}), 400
    
    # ファイルサイズを確認
    if request.content_length > MAX_FILE_SIZE:
        return jsonify({'error': f'ファイルサイズが大きすぎます。最大サイズは{MAX_FILE_SIZE/(1024*1024*1024):.1f}GBです'}), 400
    
    # ファイル形式を確認
    if not allowed_file(file.filename):
        return jsonify({'error': '許可されていないファイル形式です'}), 400
    
    # ファイルID（UUID）を生成
    file_id = str(uuid.uuid4())
    
    # セキュリティのためにファイル名を一意に
    secure_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, secure_filename)
    
    # ファイルを保存
    file.save(file_path)
    
    # ファイルタイプを検出
    mime = magic.Magic(mime=True)
    file_type = mime.from_file(file_path)
    
    # 今の日時を取得
    upload_time = datetime.now().isoformat()
    
    # 期限切れ日時を計算
    expiration_time = (datetime.now() + timedelta(days=FILE_RETENTION_DAYS)).isoformat()
    
    # メタデータを更新
    metadata = get_file_metadata()
    metadata[file_id] = {
        'filename': secure_filename,
        'original_filename': file.filename,
        'file_type': file_type,
        'file_size': os.path.getsize(file_path),
        'upload_time': upload_time,
        'expiration_time': expiration_time
    }
    save_file_metadata(metadata)
    
    # ダウンロードURLを生成
    download_url = f"/transfer/download/{file_id}"
    
    return jsonify({
        'success': True,
        'file_id': file_id,
        'download_url': download_url,
        'expiration_time': expiration_time
    })

@transfer_bp.route('/download/<file_id>')
def download_file(file_id):
    """ファイルをダウンロードする"""
    metadata = get_file_metadata()
    
    # ファイルIDが存在するか確認
    if file_id not in metadata:
        return jsonify({'error': 'ファイルが見つかりません'}), 404
    
    file_info = metadata[file_id]
    filename = file_info['filename']
    original_filename = file_info['original_filename']
    
    # ファイルが存在するか確認
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        # メタデータからも削除
        del metadata[file_id]
        save_file_metadata(metadata)
        return jsonify({'error': 'ファイルが見つかりません'}), 404
    
    return send_from_directory(
        UPLOAD_FOLDER, 
        filename,
        as_attachment=True,
        download_name=original_filename
    )

@transfer_bp.route('/files')
def list_files():
    """利用可能なファイルの一覧を取得"""
    metadata = get_file_metadata()
    files = []
    
    for file_id, file_info in metadata.items():
        # ファイルが実際に存在するか確認
        file_path = os.path.join(UPLOAD_FOLDER, file_info['filename'])
        if os.path.exists(file_path):
            files.append({
                'file_id': file_id,
                'filename': file_info['original_filename'],
                'file_size': file_info['file_size'],
                'upload_time': file_info['upload_time'],
                'expiration_time': file_info['expiration_time']
            })
    
    return jsonify({'files': files})

@transfer_bp.route('/delete/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """ファイルを削除する"""
    metadata = get_file_metadata()
    
    # ファイルIDが存在するか確認
    if file_id not in metadata:
        return jsonify({'error': 'ファイルが見つかりません'}), 404
    
    file_info = metadata[file_id]
    filename = file_info['filename']
    
    # ファイルが存在するか確認
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        # ファイルを削除
        os.remove(file_path)
    
    # メタデータから削除
    del metadata[file_id]
    save_file_metadata(metadata)
    
    return jsonify({'success': True}) 