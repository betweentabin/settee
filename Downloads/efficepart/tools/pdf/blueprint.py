#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from io import BytesIO
import zipfile
import logging

# 現在のディレクトリと親ディレクトリをPythonパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.insert(0, parent_dir)

# お知らせ用のログ設定
logging.getLogger(__name__).info("PDF blueprint imported")

# サードパーティライブラリのインポート
from flask import Blueprint, request, send_file, render_template, jsonify, url_for, redirect, current_app
from PyPDF2 import PdfMerger, PdfReader, PdfWriter

# テンプレートとスタティックファイルのパスを設定
template_dir = os.path.join(current_dir, 'templates')
static_dir = os.path.join(current_dir, 'static')

# Blueprintの作成
pdf_bp = Blueprint('pdf', __name__, 
                   template_folder=template_dir,
                   static_folder=static_dir,
                   url_prefix='/pdf')

# アップロード先のディレクトリを設定
UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

# PDF処理用のルート
@pdf_bp.route('/')
def index():
    """PDFツールのメインページを表示"""
    return render_template('pages/pdf_index.html')

@pdf_bp.route('/index')
def pdf_index():
    """PDFツールのインデックスページを直接表示"""
    return render_template('pages/pdf_index.html')

@pdf_bp.route('/combine', methods=['GET', 'POST'])
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
            
            current_app.logger.info(f"PDFファイルを{len(files)}個結合しました")
            
            return send_file(
                merged_pdf,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='combined.pdf'
            )
        except Exception as e:
            current_app.logger.error(f"PDF結合中にエラーが発生しました: {str(e)}")
            return jsonify({'error': f'PDF結合中にエラーが発生しました: {str(e)}'}), 500
        
    return render_template('pages/pdf_combine.html')

@pdf_bp.route('/split', methods=['GET', 'POST'])
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
                current_app.logger.info(f"PDFファイル '{file.filename}' を {len(pdf.pages)} ページに分割しました")
                
                return send_file(
                    memory_file,
                    mimetype='application/zip',
                    as_attachment=True,
                    download_name='split_pages.zip'
                )
        except Exception as e:
            current_app.logger.error(f"PDF分割中にエラーが発生しました: {str(e)}")
            return jsonify({'error': f'PDF分割中にエラーが発生しました: {str(e)}'}), 500
            
    return redirect(url_for('pdf.index'))

@pdf_bp.route('/extract', methods=['POST'])
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
            
            # ページ範囲を解析
            pages_to_extract = []
            for page_range in page_ranges.split(','):
                page_range = page_range.strip()
                if '-' in page_range:
                    # 範囲指定（例: 1-5）
                    start, end = map(int, page_range.split('-'))
                    pages_to_extract.extend(range(start-1, end))
                else:
                    # 単一ページ
                    if page_range.isdigit():
                        pages_to_extract.append(int(page_range) - 1)
            
            # 抽出したPDFを作成
            output = PdfWriter()
            for page_num in sorted(pages_to_extract):
                if 0 <= page_num < len(pdf.pages):
                    output.add_page(pdf.pages[page_num])
            
            # メモリに書き込む
            output_pdf = BytesIO()
            output.write(output_pdf)
            output_pdf.seek(0)
            
            current_app.logger.info(f"PDFファイル '{file.filename}' から {len(pages_to_extract)} ページを抽出しました")
            
            return send_file(
                output_pdf,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='extracted_pages.pdf'
            )
    except Exception as e:
        current_app.logger.error(f"PDFページ抽出中にエラーが発生しました: {str(e)}")
        return jsonify({'error': f'PDFページ抽出中にエラーが発生しました: {str(e)}'}), 500
        
    return redirect(url_for('pdf.index')) 