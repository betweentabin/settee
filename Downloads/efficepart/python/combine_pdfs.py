#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import os
import base64
import tempfile
from io import BytesIO

def main():
    """
    PDFファイル結合スクリプト
    複数のPDFファイルを結合するスクリプト
    """
    # リクエストデータの読み込み
    if len(sys.argv) > 1:
        request_file = sys.argv[1]
        if os.path.exists(request_file):
            with open(request_file, 'r') as f:
                try:
                    request_data = json.load(f)
                except json.JSONDecodeError:
                    request_data = {}
        else:
            request_data = {}
    else:
        request_data = {}

    # PDFファイルのデータが含まれているか確認
    if 'pdf_files' not in request_data:
        print(json.dumps({
            'status': 'error',
            'message': 'PDFファイルが提供されていません'
        }, ensure_ascii=False))
        return

    pdf_data_list = request_data['pdf_files']
    
    try:
        # PyPDF2をインポート
        from PyPDF2 import PdfMerger, PdfReader
        
        # PDFマージャーを作成
        merger = PdfMerger()
        
        # 一時ファイルリスト
        temp_files = []
        
        # アップロードされたファイルを追加
        for pdf_data in pdf_data_list:
            if not pdf_data:
                continue
            
            # Base64デコード
            pdf_content = base64.b64decode(pdf_data)
            
            # 一時ファイルに保存
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            temp_file.write(pdf_content)
            temp_file.close()
            
            # 一時ファイルのパスを保存
            temp_files.append(temp_file.name)
            
            # PDFとして追加
            merger.append(temp_file.name)
        
        # 結合したPDFを作成
        output_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        output_temp.close()
        merger.write(output_temp.name)
        merger.close()
        
        # 出力ファイルを読み込み
        with open(output_temp.name, 'rb') as f:
            merged_pdf_data = f.read()
        
        # Base64エンコード
        merged_pdf_base64 = base64.b64encode(merged_pdf_data).decode('utf-8')
        
        # 一時ファイルの削除
        for temp_file in temp_files:
            os.unlink(temp_file)
        os.unlink(output_temp.name)
        
        # 成功レスポンスを返す
        print(json.dumps({
            'status': 'success',
            'message': 'PDFファイルを結合しました',
            'pdf_data': merged_pdf_base64
        }, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({
            'status': 'error',
            'message': f'エラーが発生しました: {str(e)}'
        }, ensure_ascii=False))

if __name__ == "__main__":
    main() 