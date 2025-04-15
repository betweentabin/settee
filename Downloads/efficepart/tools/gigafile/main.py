from flask import Flask, request, jsonify, send_file, render_template_string, redirect, url_for
from werkzeug.utils import secure_filename
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import os
import uuid
import json
import shutil
import secrets
import hashlib
import zipfile
from pathlib import Path
from flask_cors import CORS

# ファイルサイズの制限 (300GB)
MAX_FILE_SIZE = 300 * 1024 * 1024 * 1024

# ファイルの保存期間（7日間）
FILE_RETENTION_DAYS = 7

# アップロードされたファイルを保存するディレクトリ
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ファイル情報を保存するディレクトリ
META_DIR = os.path.join(UPLOAD_DIR, "metadata")
os.makedirs(META_DIR, exist_ok=True)

# ファイル情報を保存する関数
def save_file_metadata(file_id: str, original_name: str, file_path: str, password_hash: Optional[str] = None) -> None:
    metadata = {
        "original_name": original_name,
        "file_path": file_path,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(days=FILE_RETENTION_DAYS)).isoformat(),
        "password_hash": password_hash
    }
    
    meta_path = os.path.join(META_DIR, f"{file_id}.json")
    with open(meta_path, 'w') as f:
        json.dump(metadata, f)

# ファイル情報を取得する関数
def get_file_metadata(file_id: str) -> Optional[Dict]:
    meta_path = os.path.join(META_DIR, f"{file_id}.json")
    if not os.path.exists(meta_path):
        return None
    
    with open(meta_path, 'r') as f:
        metadata = json.load(f)
        
    # 期限切れのチェック
    expires_at = datetime.fromisoformat(metadata['expires_at'])
    if datetime.now() > expires_at:
        # 期限切れのファイルを削除
        os.remove(meta_path)
        if os.path.exists(metadata['file_path']):
            os.remove(metadata['file_path'])
        return None
        
    return metadata

app = Flask(__name__)
app.static_folder = os.path.join(os.path.dirname(__file__), 'src')
app.static_url_path = '/src'

# CORSを有効化
CORS(app)

# 静的ファイルのキャッシュを無効化（開発時のみ）
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# 許可されるファイル拡張子のリスト
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.rar', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'}

def is_allowed_file(filename: str) -> bool:
    """ファイルの拡張子が許可されているかチェックする"""
    ext = os.path.splitext(filename)[1].lower()
    # すべてのファイルを許可する場合はコメントを外してください
    # return True
    return ext in ALLOWED_EXTENSIONS

def verify_password(file_id: str, password: Optional[str] = None) -> bool:
    metadata = get_file_metadata(file_id)
    if not metadata or not metadata.get('password_hash'):
        return True
    if not password:
        return False
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return secrets.compare_digest(password_hash, metadata['password_hash'])

@app.route('/')
@app.route('/transfer')
def transfer_page():
    # transfer_index.html が存在しない場合、404 を返す
    html_path = os.path.join(app.static_folder, "transfer_index.html")
    if not os.path.exists(html_path):
        return "Transfer HTML file not found", 404
    return send_file(html_path)

@app.route('/files')
def list_files():
    files = []
    for filename in os.listdir(UPLOAD_DIR):
        if os.path.isfile(os.path.join(UPLOAD_DIR, filename)):
            files.append({
                "filename": filename,
                "size": os.path.getsize(os.path.join(UPLOAD_DIR, filename)),
                "upload_date": datetime.now().isoformat()
            })
    return jsonify({"files": files})

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'files[]' not in request.files:
            return jsonify({"error": "ファイルが選択されていません"}), 400

        files = request.files.getlist('files[]')
        password = request.form.get('password')
        
        if not files:
            return jsonify({"error": "ファイルが選択されていません"}), 400

        results = []

        for file in files:
            if file.filename == '':
                continue
                
            # ファイルタイプのチェック
            if not is_allowed_file(file.filename):
                return jsonify({
                    "error": f"サポートされていないファイル形式です: {file.filename}"
                }), 400
            
            # ユニークなファイル名を生成
            file_extension = os.path.splitext(file.filename)[1].lower()
            file_id = str(uuid.uuid4())
            unique_filename = f"{file_id}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            try:
                # ファイルを保存
                file.save(file_path)
                
                file_size = os.path.getsize(file_path)
                
                # パスワードが設定されていればハッシュ化
                password_hash = None
                if password:
                    password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                # ファイル情報を保存
                save_file_metadata(file_id, file.filename, file_path, password_hash)
                
                # ダウンロードURLを生成（相対パスを使用）
                download_url = f"/download/{file_id}"
                results.append({
                    "filename": file.filename,
                    "download_url": download_url,
                    "file_id": file_id,
                    "size": file_size,
                    "expires_at": (datetime.now() + timedelta(days=FILE_RETENTION_DAYS)).isoformat(),
                    "password_protected": password_hash is not None
                })
            except Exception as e:
                if os.path.exists(file_path):
                    os.remove(file_path)
                return jsonify({"error": f"ファイルの保存中にエラーが発生しました: {str(e)}"}), 500
        
        return jsonify({
            "message": "ファイルのアップロードが完了しました",
            "files": results
        })
    except Exception as e:
        return jsonify({"error": f"アップロード処理中にエラーが発生しました: {str(e)}"}), 500

@app.route('/download/<file_id>')
def download_file(file_id):
    password = request.args.get('password')
    
    metadata = get_file_metadata(file_id)
    if not metadata:
        return "ファイルが見つかりません。期限切れの可能性があります。", 404
    
    # パスワードの確認
    if not verify_password(file_id, password):
        # パスワードが必要な場合、パスワード入力フォームを表示
        password_form = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>パスワード入力</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100">
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
    
    file_path = metadata['file_path']
    if not os.path.exists(file_path):
        return "ファイルが見つかりません", 404
    
    return send_file(
        file_path,
        download_name=metadata['original_name'],
        as_attachment=True
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)