#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import io
import json
import pandas as pd
from datetime import datetime
from PIL import Image as PILImage, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak, Frame, PageTemplate, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import base64
import logging

# 現在のディレクトリと親ディレクトリをPythonパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.insert(0, parent_dir)

# お知らせ用のログ設定
logging.getLogger(__name__).info("Nametag blueprint imported")

# Flaskライブラリのインポート
from flask import Blueprint, request, render_template, send_file, jsonify, current_app

# テンプレートとスタティックファイルのパスを設定
template_dir = os.path.join(current_dir, 'templates')
static_dir = os.path.join(current_dir, 'static')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
FONT_DIR = os.path.join(current_dir, 'static', 'fonts')

# ディレクトリが存在しない場合は作成
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FONT_DIR, exist_ok=True)

# Blueprintの作成
nametag_bp = Blueprint('nametag', __name__, 
                       template_folder=template_dir,
                       static_folder=static_dir,
                       url_prefix='/nametag')

# エラーログをファイルに書き出す設定を追加
logging.basicConfig(
    filename=os.path.join(current_dir, 'logs', 'app.log'),
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@nametag_bp.route('/')
def index():
    """
    名札生成ツールのメインページを表示
    """
    return render_template('pages/nametag_index.html')

@nametag_bp.route('/upload', methods=['POST'])
def upload_file():
    """
    Excelファイルをアップロードして処理する
    """
    # ファイルがリクエストにあるか確認
    if 'file' not in request.files:
        return jsonify({'error': 'ファイルがアップロードされていません'}), 400
    
    file = request.files['file']
    
    # ファイル名が空でないか確認
    if file.filename == '':
        return jsonify({'error': 'ファイルが選択されていません'}), 400
    
    # ファイルの拡張子を確認
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'ExcelファイルではありませんErrorです'}), 400
    
    # ファイルを保存
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    
    try:
        # Excelファイルを読み込む
        df = pd.read_excel(file_path)
        
        # 必要な列が含まれているか確認
        required_columns = ['1行目', '2行目', '3行目', '4行目', '5行目', 
                           '6行目', '7行目', '8行目', '9行目', '10行目']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({'error': f'ExcelファイルにExcel用必要な列がありません: {", ".join(missing_columns)}'}), 400
        
        # セッションにファイルパスを保存
        # Blueprintではsession使用時に注意が必要なため、単純にパスを返す
        return jsonify({'success': True, 'file_path': file_path})
        
    except Exception as e:
        current_app.logger.error(f"Excelファイル処理中にエラーが発生しました: {str(e)}")
        return jsonify({'error': f'Excelファイルの処理中にエラーが発生しました: {str(e)}'}), 500

@nametag_bp.route('/select_design', methods=['GET', 'POST'])
def select_design():
    """
    デザイン設定を選択するページを表示または処理する
    """
    if request.method == 'GET':
        # ファイルパスのパラメータが含まれているかチェック
        file_path = request.args.get('file_path')
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'ファイルが見つかりません'}), 404
            
        return render_template('pages/nametag_design.html', file_path=file_path)
    
    elif request.method == 'POST':
        # フォームからデザイン設定を取得
        design_settings = {
            'file_path': request.form.get('file_path'),
            'card_width': int(request.form.get('card_width', 90)),
            'card_height': int(request.form.get('card_height', 55)),
            'font_name': request.form.get('font_name', 'NotoSansJP-Regular'),
            'font_size': int(request.form.get('font_size', 12)),
            'line_spacing': float(request.form.get('line_spacing', 1.2)),
            'text_color': request.form.get('text_color', '#000000'),
            'background_color': request.form.get('background_color', '#FFFFFF'),
            'alignment': request.form.get('alignment', 'CENTER'),
            # 各行の位置設定
            '1_x': int(request.form.get('1_x', 50)),
            '1_y': int(request.form.get('1_y', 20)),
            '2_x': int(request.form.get('2_x', 50)),
            '2_y': int(request.form.get('2_y', 40)),
            '3_x': int(request.form.get('3_x', 50)),
            '3_y': int(request.form.get('3_y', 60)),
            '4_x': int(request.form.get('4_x', 50)),
            '4_y': int(request.form.get('4_y', 80)),
            '5_x': int(request.form.get('5_x', 50)),
            '5_y': int(request.form.get('5_y', 100)),
            '6_x': int(request.form.get('6_x', 50)),
            '6_y': int(request.form.get('6_y', 120)),
            '7_x': int(request.form.get('7_x', 50)),
            '7_y': int(request.form.get('7_y', 140)),
            '8_x': int(request.form.get('8_x', 50)),
            '8_y': int(request.form.get('8_y', 160)),
            '9_x': int(request.form.get('9_x', 50)),
            '9_y': int(request.form.get('9_y', 180)),
            '10_x': int(request.form.get('10_x', 50)),
            '10_y': int(request.form.get('10_y', 200))
        }
        
        # 背景画像をアップロード
        if 'background_image' in request.files:
            background_image = request.files['background_image']
            if background_image.filename != '':
                background_image_path = os.path.join(UPLOAD_FOLDER, background_image.filename)
                background_image.save(background_image_path)
                design_settings['background_image'] = background_image_path
        
        return jsonify(design_settings)

@nametag_bp.route('/generate_preview', methods=['POST'])
def generate_preview_endpoint():
    """
    プレビュー画像を生成するエンドポイント
    """
    design_settings = request.json
    preview_image = generate_preview(design_settings)
    return jsonify({'preview_image': preview_image})

@nametag_bp.route('/generate_pdf', methods=['POST'])
def generate_pdf_endpoint():
    """
    PDFを生成するエンドポイント
    """
    design_settings = request.json
    file_path = design_settings.get('file_path')
    
    try:
        # Excelファイルを読み込む
        df = pd.read_excel(file_path)
        
        # PDFを生成
        pdf_buffer = generate_pdf(df, design_settings)
        
        # ファイルとして送信
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"nametag_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
            mimetype="application/pdf"
        )
    except Exception as e:
        current_app.logger.error(f"PDF生成中にエラーが発生しました: {str(e)}")
        return jsonify({'error': f'PDF生成中にエラーが発生しました: {str(e)}'}), 500

def generate_preview(design_settings):
    """
    プレビュー画像を生成する関数
    """
    # プレビュー画像を生成するためのバッファ
    buffer = io.BytesIO()

    # 画像のサイズを設定（ミリメートルをピクセルに変換）
    dpi = 72  # DPI（解像度）を72に設定（一般的な画面解像度）
    card_width = int(design_settings['card_width'] * mm * dpi / 25.4)
    card_height = int(design_settings['card_height'] * mm * dpi / 25.4)

    # 画像の背景色を設定
    background_color = design_settings['background_color']
    image = PILImage.new('RGB', (card_width, card_height), background_color)
    image_draw = ImageDraw.Draw(image)

    # 背景画像を適用
    if 'background_image' in design_settings:
        background_image_path = design_settings['background_image']
        background_image = PILImage.open(background_image_path)
        background_image = background_image.resize((card_width, card_height), PILImage.LANCZOS)
        image.paste(background_image, (0, 0))

    # フォントの設定
    font_path = os.path.join(FONT_DIR, f"{design_settings['font_name']}.ttf")
    try:
        # フォントサイズをピクセルに変換
        font_size = int(design_settings['font_size'] * dpi / 25.4)
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        current_app.logger.error(f"フォントの読み込みに失敗しました: {e}")
        # デフォルトのフォントを使用
        font = ImageFont.load_default()

    # テキストの色を設定
    text_color = design_settings['text_color']

    # テキストの配置を計算
    text_lines = [
        ("株式会社サンプル", design_settings['1_x'], design_settings['1_y']),
        ("営業部", design_settings['2_x'], design_settings['2_y']),
        ("山田太郎", design_settings['3_x'], design_settings['3_y']),
        ("Tel: 03-1234-5678", design_settings['4_x'], design_settings['4_y']),
        ("Email: yamada@example.com", design_settings['5_x'], design_settings['5_y'])
    ]
    for line, x_position, y_position in text_lines:
        image_draw.text((x_position, y_position), line, fill=text_color, font=font)

    # トリムマークの描画
    trim_color = "black"
    trim_width = 1

    # トリムマークの描画関数
    def draw_trim_mark(x1, y1, x2, y2):
        image_draw.line([(x1, y1), (x2, y2)], fill=trim_color, width=trim_width)

    # トリムマークを描画
    line_length = 20
    # 右上
    draw_trim_mark(card_width, 0, card_width-line_length, 0)
    draw_trim_mark(card_width-5, 0, card_width-line_length, -8)
    # 左上
    draw_trim_mark(0, 0, line_length, 0)
    draw_trim_mark(5, 0, line_length, -8)
    # 右下
    draw_trim_mark(card_width, card_height, card_width-line_length, card_height)
    draw_trim_mark(card_width-5, card_height, card_width-line_length, card_height+8)
    # 左下
    draw_trim_mark(0, card_height, line_length, card_height)
    draw_trim_mark(5, card_height, line_length, card_height+8)

    # 画像をBase64形式に変換
    image.save(buffer, format="PNG")
    image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{image_data}"

def generate_pdf(df, design_settings):
    """
    PDFを生成する関数
    """
    # フォントの登録
    font_name = design_settings['font_name']
    font_path = os.path.join(FONT_DIR, f"{font_name}.ttf")
    pdfmetrics.registerFont(TTFont(font_name, font_path))

    buffer = io.BytesIO()

    # トンボを描画する関数
    def draw_trim_marks(canvas, doc):
        # トンボのサイズ（3mm）
        trim_mark_length = 3 * mm
        card_width = design_settings['card_width'] * mm
        card_height = design_settings['card_height'] * mm

        # ページの中央に名札を配置
        page_width, page_height = A4
        x_center = (page_width - card_width) / 2
        y_center = (page_height - card_height) / 2

        # 名札の四隅にトンボを描画
        # 左上
        canvas.line(x_center, y_center, x_center + trim_mark_length, y_center)  # 水平線
        canvas.line(x_center, y_center, x_center, y_center + trim_mark_length)  # 垂直線
        # 右上
        canvas.line(x_center + card_width, y_center, x_center + card_width - trim_mark_length, y_center)  # 水平線
        canvas.line(x_center + card_width, y_center, x_center + card_width, y_center + trim_mark_length)  # 垂直線
        # 左下
        canvas.line(x_center, y_center + card_height, x_center + trim_mark_length, y_center + card_height)  # 水平線
        canvas.line(x_center, y_center + card_height, x_center, y_center + card_height - trim_mark_length)  # 垂直線
        # 右下
        canvas.line(x_center + card_width, y_center + card_height, x_center + card_width - trim_mark_length, y_center + card_height)  # 水平線
        canvas.line(x_center + card_width, y_center + card_height, x_center + card_width, y_center + card_height - trim_mark_length)  # 垂直線

    # 背景画像を描画する関数
    def draw_background(canvas, doc):
        if 'background_image' in design_settings:
            background_image_path = design_settings['background_image']
            canvas.drawImage(background_image_path, 0, 0, width=A4[0], height=A4[1], preserveAspectRatio=True)

    # ページテンプレートを作成
    card_width = design_settings['card_width'] * mm
    card_height = design_settings['card_height'] * mm
    page_width, page_height = A4
    x_center = (page_width - card_width) / 2
    y_center = (page_height - card_height) / 2

    frame = Frame(
        x_center, y_center, card_width, card_height,
        leftPadding=10 * mm, rightPadding=10 * mm, topPadding=10 * mm, bottomPadding=10 * mm,
        showBoundary=1  # デバッグ用にフレームの境界線を表示
    )
    page_template = PageTemplate(id='NameTagPage', frames=[frame], onPage=draw_trim_marks, onPageEnd=draw_background)

    # PDFドキュメントを作成
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=10 * mm,
        leftMargin=10 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
    )
    
    # ページテンプレートを追加
    doc.addPageTemplates([page_template])

    # スタイルの設定
    styles = getSampleStyleSheet()
    alignment = {
        'LEFT': 0,
        'CENTER': 1,
        'RIGHT': 2
    }[design_settings['alignment']]

    # カラーコードの処理
    text_color = design_settings['text_color'].lstrip('#')
    bg_color = design_settings['background_color'].lstrip('#')

    custom_style = ParagraphStyle(
        'CustomStyle',
        parent=styles['Normal'],
        fontSize=design_settings['font_size'],
        alignment=alignment,
        fontName=font_name,
        textColor=colors.HexColor('#' + text_color),
        backColor=colors.HexColor('#' + bg_color),
        leading=design_settings['font_size'] * design_settings['line_spacing'],  # 行間を設定
    )

    # PDFの内容を構築
    elements = []
    for _, row in df.iterrows():
        # 各名刺の内容
        card_content = [
            Paragraph(row['1行目'], custom_style),
            Paragraph(row['2行目'], custom_style),
            Paragraph(row['3行目'], custom_style),
            Paragraph(row['4行目'], custom_style),
            Paragraph(row['5行目'], custom_style),
            Paragraph(row['6行目'], custom_style),
            Paragraph(row['7行目'], custom_style),
            Paragraph(row['8行目'], custom_style),
            Paragraph(row['9行目'], custom_style),
            Paragraph(row['10行目'], custom_style),
            Spacer(1, 20 * mm)  # 名刺間のスペース
        ]
        elements.extend(card_content)
        elements.append(PageBreak())  # ページ区切りを追加

    # PDFを生成
    doc.build(elements)
    buffer.seek(0)
    return buffer 