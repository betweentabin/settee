#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

# Import the module resolver to ensure all dependencies are accessible
import module_resolver

# Set up the PDF tool environment only if running as standalone script
# app.pyからインポートされた場合は既にsetup_tool_environmentが呼ばれているので重複を避ける
if __name__ == "__main__":
    module_resolver.setup_tool_environment('pdf')

# Standard library imports
from io import BytesIO
import zipfile
import logging

# Third-party imports
from flask import Flask, request, send_file, render_template, jsonify, url_for, redirect
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from flask_wtf.csrf import CSRFProtect

# ロギングの設定
logger = logging.getLogger('PDF_app')

# 親ディレクトリへのパスを取得
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'templates'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))

# デバッグ出力を追加して実際のパスを確認
print(f"テンプレートディレクトリ: {template_dir}")
print(f"静的ファイルディレクトリ: {static_dir}")

# Flaskアプリケーションを作成
PDF_app = Flask(__name__, 
                 template_folder=template_dir,
                 static_folder=static_dir)

# アプリケーションインスタンスを作成（これがimport_tool_appから参照される）
app = PDF_app

# CSRF保護を有効化
csrf = CSRFProtect(app)

# セキュリティヘッダーの追加
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'"
    return response

# セキュアなファイル名生成関数
def secure_filename(filename):
    """
    安全なファイル名を生成する。
    元のファイル名から拡張子を保持し、本体は安全なランダム文字列に置き換える。
    """
    if not filename:
        return None
    # 拡張子部分を取得
    ext = os.path.splitext(filename)[1].lower()
    # PDFファイルのみ許可
    if ext != '.pdf':
        return None
    # 安全なランダム文字列を生成
    import secrets
    safe_part = secrets.token_hex(16)
    return f"{safe_part}{ext}"

# アップロードされたファイルのバリデーション
def validate_pdf_file(file):
    """
    アップロードされたファイルが本当にPDFファイルかチェックする。
    """
    if not file or not file.filename.lower().endswith('.pdf'):
        return False
    
    # ファイルの先頭バイトをチェック（PDFマジックナンバー）
    try:
        header = file.read(5)
        file.seek(0)  # ポインタを戻す
        return header == b'%PDF-'
    except:
        return False

# アップロード先のディレクトリを設定
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# PDF処理用のルート
@app.route('/')
def index():
    """PDFツールのメインページを表示"""
    return render_template('pages/pdf_index.html')

@app.route('/combine', methods=['GET', 'POST'])
def combine_pdfs():
    """複数のPDFファイルを結合する"""
    if request.method == 'POST':
        if 'pdf_files' not in request.files:
            return jsonify({'error': 'PDFファイルがアップロードされていません'}), 400
            
        files = request.files.getlist('pdf_files')
        if not files or files[0].filename == '':
            return jsonify({'error': 'ファイルが選択されていません'}), 400
            
        try:
            # PDFマージャーを作成
            merger = PdfMerger()
            
            # アップロードされたファイルを追加
            for file in files:
                if file and file.filename.lower().endswith('.pdf'):
                    pdf_content = BytesIO(file.read())
                    merger.append(pdf_content)
            
            # 結合したPDFを作成
            merged_pdf = BytesIO()
            merger.write(merged_pdf)
            merger.close()
            merged_pdf.seek(0)
            
            logger.info(f"PDFファイルを{len(files)}個結合しました")
            
            return send_file(
                merged_pdf,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='combined.pdf'
            )
        except Exception as e:
            logger.error(f"PDF結合中にエラーが発生しました: {str(e)}")
            return jsonify({'error': f'PDF結合中にエラーが発生しました: {str(e)}'}), 500
        
    return render_template('pages/pdf_combine.html')

@app.route('/split', methods=['GET', 'POST'])
def split_pdf():
    """PDFファイルを分割する"""
    if request.method == 'POST':
        if 'pdf_file' not in request.files:
            return jsonify({'error': 'PDFファイルがアップロードされていません'}), 400
            
        file = request.files['pdf_file']
        if file.filename == '':
            return jsonify({'error': 'ファイルが選択されていません'}), 400
            
        try:
            if file and file.filename.lower().endswith('.pdf'):
                pdf_content = BytesIO(file.read())
                pdf = PdfReader(pdf_content)
                
                # 分割したPDFファイルを保存するためのメモリバッファ
                memory_file = BytesIO()
                
                # ZIPファイルを作成
                with zipfile.ZipFile(memory_file, 'w') as zf:
                    # 各ページを個別のPDFとして保存
                    for i in range(len(pdf.pages)):
                        output = PdfWriter()
                        output.add_page(pdf.pages[i])
                        
                        # ページをメモリに書き込む
                        page_buffer = BytesIO()
                        output.write(page_buffer)
                        page_buffer.seek(0)
                        
                        # ZIPファイルに追加
                        zf.writestr(f'page_{i+1}.pdf', page_buffer.getvalue())
                
                memory_file.seek(0)
                logger.info(f"PDFファイル '{file.filename}' を {len(pdf.pages)} ページに分割しました")
                
                return send_file(
                    memory_file,
                    mimetype='application/zip',
                    as_attachment=True,
                    download_name='split_pages.zip'
                )
        except Exception as e:
            logger.error(f"PDF分割中にエラーが発生しました: {str(e)}")
            return jsonify({'error': f'PDF分割中にエラーが発生しました: {str(e)}'}), 500
            
    return redirect(url_for('index'))

@app.route('/extract', methods=['POST'])
def extract_pages():
    """PDFファイルから特定のページを抽出する"""
    if 'pdf_file' not in request.files:
        return jsonify({'error': 'PDFファイルがアップロードされていません'}), 400
        
    file = request.files['pdf_file']
    page_ranges = request.form.get('page_ranges', '')
    
    if file.filename == '':
        return jsonify({'error': 'ファイルが選択されていません'}), 400
        
    try:
        if file and file.filename.lower().endswith('.pdf'):
            pdf_content = BytesIO(file.read())
            pdf = PdfReader(pdf_content)
            total_pages = len(pdf.pages)
            
            # ページ範囲をパース (例: "1-3,5,7-10")
            pages_to_extract = []
            for page_range in page_ranges.split(','):
                if '-' in page_range:
                    start, end = map(int, page_range.split('-'))
                    pages_to_extract.extend(range(start, end + 1))
                else:
                    try:
                        pages_to_extract.append(int(page_range))
                    except ValueError:
                        continue
            
            # ページ番号を1から始まる番号から0から始まる索引に変換
            pages_to_extract = [p - 1 for p in pages_to_extract if 1 <= p <= total_pages]
            
            if not pages_to_extract:
                return jsonify({'error': '有効なページ範囲が指定されていません'}), 400
                
            # 新しいPDFを作成
            output = PdfWriter()
            for page_num in pages_to_extract:
                output.add_page(pdf.pages[page_num])
                
            # メモリに書き込む
            output_pdf = BytesIO()
            output.write(output_pdf)
            output_pdf.seek(0)
            
            logger.info(f"PDFファイル '{file.filename}' から {len(pages_to_extract)} ページを抽出しました")
            
            return send_file(
                output_pdf,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='extracted_pages.pdf'
            )
    except Exception as e:
        logger.error(f"ページ抽出中にエラーが発生しました: {str(e)}")
        return jsonify({'error': f'ページ抽出中にエラーが発生しました: {str(e)}'}), 500
        
    return redirect(url_for('index'))

# スタンドアロンとして実行する場合
if __name__ == '__main__':
    app.run(debug=True, port=5003)
