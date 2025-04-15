# app.py
from flask import Blueprint, render_template, request, send_file, jsonify
import os
import tempfile
from werkzeug.utils import secure_filename
from PIL import Image
from datetime import datetime
import logging

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.info("Converter blueprint imported")

# 現在のディレクトリと親ディレクトリをPythonパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
import sys
sys.path.insert(0, parent_dir)

# テンプレートとスタティックファイルのパスを設定
template_dir = os.path.join(current_dir, 'templates')
static_dir = os.path.join(current_dir, 'static')

# Blueprintの作成
converter_bp = Blueprint('converter', __name__, 
                    template_folder=template_dir,
                    static_folder=static_dir,
                    url_prefix='/converter')

# アップロード先のディレクトリを設定
UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'docx', 'xlsx'}

def allowed_file(filename):
    """許可されたファイル拡張子か確認"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_temp_files():
    """一時ファイルのクリーンアップ"""
    try:
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(file_path):
                os.unlink(file_path)
        logger.info("一時ファイルをクリーンアップしました")
    except Exception as e:
        logger.error(f"一時ファイルのクリーンアップに失敗: {str(e)}")

@converter_bp.route('/')
def index():
    """メインページの表示"""
    cleanup_temp_files()
    return render_template('conversion_index.html')

@converter_bp.route('/upload', methods=['POST'])
def handle_conversion():
    """ファイル変換処理のメインエンドポイント"""
    try:
        # ファイルの検証
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'ファイルが選択されていません'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': '無効なファイル名です'}), 400

        # パラメータの取得
        output_format = request.form.get('output_format', 'pdf')
        quality = request.form.get('quality', 'medium')
        logger.info(f"変換リクエスト受信: {file.filename} -> {output_format} ({quality})")

        # ファイルの保存
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            logger.info(f"ファイルを一時保存: {filepath}")

            # 変換処理の実行
            output_path = perform_conversion(
                filepath=filepath,
                output_format=output_format,
                quality=quality
            )

            # 変換後のファイル送信
            return send_file(
                output_path,
                as_attachment=True,
                download_name=generate_output_filename(output_format),
                mimetype=get_mime_type(output_format)
            )

        return jsonify({'status': 'error', 'message': '許可されていないファイル形式です'}), 400

    except Exception as e:
        logger.error(f"変換処理中にエラーが発生: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

def perform_conversion(filepath, output_format, quality):
    """実際の変換処理を実行"""
    try:
        # 変換先のファイルパス生成
        output_path = os.path.join(
            UPLOAD_FOLDER,
            f"converted_{datetime.now().strftime('%Y%m%d%H%M%S')}.{output_format}"
        )

        # 画像→PDF変換
        if output_format == 'pdf' and filepath.lower().endswith(('png', 'jpg', 'jpeg')):
            dpi_map = {'high': 300, 'medium': 200, 'low': 96}
            img = Image.open(filepath)
            img.save(output_path, "PDF", resolution=dpi_map[quality])
            logger.info(f"画像をPDFに変換: {output_path}")
            return output_path

        # 画像→JPG変換
        elif output_format == 'jpg' and filepath.lower().endswith(('png', 'jpeg')):
            img = Image.open(filepath)
            img.save(output_path, "JPEG", quality=100)
            logger.info(f"画像をJPGに変換: {output_path}")
            return output_path

        # 画像→PNG変換
        elif output_format == 'png' and filepath.lower().endswith(('jpg', 'jpeg')):
            img = Image.open(filepath)
            img.save(output_path, "PNG")
            logger.info(f"画像をPNGに変換: {output_path}")
            return output_path

        # PDF→JPG変換
        elif output_format == 'jpg' and filepath.lower().endswith('pdf'):
            from pdf2image import convert_from_path
            images = convert_from_path(filepath)
            images[0].save(output_path, "JPEG", quality=100)
            logger.info(f"PDFをJPGに変換: {output_path}")
            return output_path

        # PDF→PNG変換
        elif output_format == 'png' and filepath.lower().endswith('pdf'):
            from pdf2image import convert_from_path
            images = convert_from_path(filepath)
            images[0].save(output_path, "PNG")
            logger.info(f"PDFをPNGに変換: {output_path}")
            return output_path

        # 他の変換処理を追加可能
        else:
            raise ValueError(f"{output_format}形式への変換は現在サポートされていません")

    except Exception as e:
        logger.error(f"変換処理失敗: {str(e)}")
        raise

def generate_output_filename(output_format):
    """出力ファイル名を生成"""
    return f"converted_{datetime.now().strftime('%Y%m%d%H%M%S')}.{output_format}"

def get_mime_type(output_format):
    """MIMEタイプのマッピング"""
    mime_map = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'jpg': 'image/jpeg',
        'png': 'image/png'
    }
    return mime_map.get(output_format, 'application/octet-stream')