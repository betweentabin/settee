#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
import uuid
import hashlib
from datetime import datetime, timedelta
from functools import wraps
import mimetypes

# 現在のディレクトリと親ディレクトリをPythonパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.insert(0, parent_dir)

# お知らせ用のログ設定
import logging
logging.getLogger(__name__).info("Gigafile blueprint imported")

# サードパーティライブラリのインポート
from flask import Blueprint, request, render_template, render_template_string, redirect, url_for, flash
from flask import jsonify, send_file, abort, session, current_app

# テンプレートとスタティックファイルのパスを設定
template_dir = os.path.join(current_dir, 'templates')
static_dir = os.path.join(current_dir, 'static')

# Blueprintの作成
gigafile_bp = Blueprint('gigafile', __name__, 
                       template_folder=template_dir,
                       static_folder=static_dir,
                       url_prefix='/gigafile')

# 設定
MAX_FILE_SIZE = 300 * 1024 * 1024 * 1024  # 300GB
FILE_RETENTION_DAYS = 7  # ファイル保持期間（日数）
UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
METADATA_FILE = os.path.join(current_dir, 'metadata.json')

# ディレクトリが存在しない場合は作成
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 許可されているファイル拡張子
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', 'tar', 'gz', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp3', 'mp4', 'wav', 'avi', 'mov'}

def allowed_file(filename):
    """許可されているファイル拡張子かを確認"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_metadata(metadata):
    """メタデータをJSONファイルに保存"""
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=4)

def load_metadata():
    """メタデータをJSONファイルから読み込み"""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def verify_password(file_id, password):
    """パスワードを検証"""
    metadata = load_metadata()
    if file_id not in metadata:
        return False
    
    file_metadata = metadata[file_id]
    if 'password_hash' not in file_metadata:
        return True  # パスワードが設定されていない場合は常にTrue
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return password_hash == file_metadata['password_hash']

def clean_expired_files():
    """期限切れのファイルを削除"""
    metadata = load_metadata()
    now = datetime.now()
    
    for file_id in list(metadata.keys()):
        file_data = metadata[file_id]
        upload_date = datetime.fromisoformat(file_data['upload_date'])
        expiration_date = upload_date + timedelta(days=FILE_RETENTION_DAYS)
        
        if now > expiration_date:
            # ファイルが存在する場合は削除
            if os.path.exists(file_data['file_path']):
                os.remove(file_data['file_path'])
            # メタデータから削除
            del metadata[file_id]
    
    # 更新されたメタデータを保存
    save_metadata(metadata)

@gigafile_bp.before_request
def before_request():
    """リクエスト前に実行される処理"""
    clean_expired_files()

@gigafile_bp.route('/')
def index():
    """メインページを表示"""
    return render_template('pages/transfer_index.html')

@gigafile_bp.route('/upload', methods=['POST'])
def upload():
    """ファイルをアップロードする"""
    # ファイルがリクエストに存在するか確認
    if 'file' not in request.files:
        return jsonify({'error': 'ファイルが選択されていません'}), 400
    
    file = request.files['file']
    
    # ファイル名が空でないか確認
    if file.filename == '':
        return jsonify({'error': 'ファイル名が空です'}), 400
    
    # ファイルサイズを確認
    if 'Content-Length' in request.headers:
        content_length = int(request.headers['Content-Length'])
        if content_length > MAX_FILE_SIZE:
            return jsonify({'error': f'ファイルサイズが大きすぎます。上限は{MAX_FILE_SIZE/(1024*1024*1024):.1f}GBです'}), 400
    
    # パスワードを取得（オプション）
    password = request.form.get('password', '')
    password_hash = None
    if password:
        password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # ファイルIDを生成
    file_id = str(uuid.uuid4())
    
    # ファイルの保存先パス
    file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{file.filename}")
    
    # ファイルを保存
    file.save(file_path)
    
    # アップロード日時
    upload_date = datetime.now().isoformat()
    
    # 有効期限
    expiration_date = (datetime.now() + timedelta(days=FILE_RETENTION_DAYS)).isoformat()
    
    # ファイルサイズ
    file_size = os.path.getsize(file_path)
    
    # ファイルのMIMEタイプを判定
    mime_type, _ = mimetypes.guess_type(file.filename)
    if mime_type is None:
        mime_type = 'application/octet-stream'
    
    # メタデータを保存
    metadata = load_metadata()
    metadata[file_id] = {
        'file_path': file_path,
        'original_name': file.filename,
        'mime_type': mime_type,
        'file_size': file_size,
        'upload_date': upload_date,
        'expiration_date': expiration_date,
        'downloads': 0
    }
    
    # パスワードが設定されている場合はハッシュを保存
    if password_hash:
        metadata[file_id]['password_hash'] = password_hash
    
    save_metadata(metadata)
    
    # ダウンロードURLを生成
    download_url = url_for('gigafile.download', file_id=file_id, _external=True)
    
    return jsonify({
        'success': True,
        'file_id': file_id,
        'download_url': download_url,
        'expiration_date': expiration_date
    })

@gigafile_bp.route('/files')
def list_files():
    """利用可能なファイルの一覧を表示"""
    metadata = load_metadata()
    files = []
    
    for file_id, file_data in metadata.items():
        # パスワード情報を除外
        file_info = {k: v for k, v in file_data.items() if k != 'password_hash'}
        file_info['file_id'] = file_id
        files.append(file_info)
    
    return render_template('pages/gigafile_files.html', files=files)

@gigafile_bp.route('/download/<file_id>')
def download(file_id):
    """ファイルをダウンロードする"""
    metadata = load_metadata()
    
    # ファイルIDが存在するか確認
    if file_id not in metadata:
        return render_template('pages/gigafile_error.html', message="ファイルが見つかりません"), 404
    
    file_metadata = metadata[file_id]
    
    # パスワードが設定されている場合
    if 'password_hash' in file_metadata:
        password = request.args.get('password', '')
        if not verify_password(file_id, password):
            # パスワード入力フォームを表示
            password_form = """
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>パスワード入力 - Gigafile</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-100 min-h-screen">
                <div class="container mx-auto px-4 py-8">
                    <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-xl font-bold mb-4">パスワード入力</h2>
                        <form method="GET" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">このファイルはパスワードで保護されています</label>
                                <input type="password" name="password" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <button type="submit" class="w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                ダウンロード
                            </button>
                        </form>
                    </div>
                </div>
            </body>
            </html>
            """
            return render_template_string(password_form)
    
    file_path = file_metadata['file_path']
    if not os.path.exists(file_path):
        return render_template('pages/gigafile_error.html', message="ファイルが見つかりません"), 404
    
    # ダウンロード回数を更新
    metadata[file_id]['downloads'] += 1
    save_metadata(metadata)
    
    return send_file(
        file_path,
        download_name=file_metadata['original_name'],
        as_attachment=True
    )

@gigafile_bp.route('/delete/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """ファイルを削除する"""
    metadata = load_metadata()
    
    # ファイルIDが存在するか確認
    if file_id not in metadata:
        return jsonify({'error': 'ファイルが見つかりません'}), 404
    
    file_metadata = metadata[file_id]
    
    # ファイルが存在する場合は削除
    if os.path.exists(file_metadata['file_path']):
        os.remove(file_metadata['file_path'])
    
    # メタデータから削除
    del metadata[file_id]
    save_metadata(metadata)
    
    return jsonify({'success': True, 'message': 'ファイルが削除されました'})

@gigafile_bp.route('/api/stats')
def get_stats():
    """統計情報を取得する"""
    metadata = load_metadata()
    
    total_files = len(metadata)
    total_size = sum(file_data.get('file_size', 0) for file_data in metadata.values())
    total_downloads = sum(file_data.get('downloads', 0) for file_data in metadata.values())
    
    return jsonify({
        'total_files': total_files,
        'total_size_bytes': total_size,
        'total_size_mb': total_size / (1024 * 1024),
        'total_downloads': total_downloads
    }) 