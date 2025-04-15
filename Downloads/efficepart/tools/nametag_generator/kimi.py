from flask import Flask, request, send_file, render_template, redirect, url_for, jsonify
import pandas as pd
from reportlab.lib.pagesizes import A4, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Frame, PageTemplate
from reportlab.pdfgen.canvas import Canvas
import io
import os
import base64
from PIL import Image as PILImage, ImageDraw, ImageFont  # Pillowをインポート
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import svgwrite
import drawsvg as draw
import json


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'  # アップロードファイルの保存先

# プロジェクトのルートディレクトリを取得
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# フォントファイルのディレクトリ
FONT_DIR = os.path.join(BASE_DIR, 'static', 'fonts')

@app.route('/')
def index():
    return render_template('index3.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return "ファイルがありません", 400

    file = request.files['file']
    if file.filename == '':
        return "ファイルが選択されていません", 400

    try:
        # エクセルファイルを読み込む
        df = pd.read_excel(file,engine='openpyxl')
        
        # 必要な列名を定義
        required_columns = ['1行目', '2行目', '3行目', '4行目', '5行目', '6行目', '7行目', '8行目', '9行目', '10行目']
        
        # 存在しない列を追加（空文字として）
        for col in required_columns:
            if col not in df.columns:
                df[col] = ''  # 空文字を挿入

        # デバッグ用：読み込まれたデータフレームの列名を表示
        print("読み込まれたデータフレームの列名:", df.columns)

    except Exception as e:
        return f"ファイルの読み込み中にエラーが発生しました: {str(e)}", 400

    # デザイン設定ページにリダイレクト
    return redirect(url_for('select_design', data=df.to_json(orient='records')))

@app.route('/select_design', methods=['GET', 'POST'])
def select_design():
    if request.method == 'GET':
        # データをJSON形式で渡す際に、base64エンコードして安全に送信
        data = request.args.get('data')
        if data:
            try:
                df = pd.read_json(data)
                # 最初の行のデータを取得
                first_row = df.iloc[0].to_dict() if not df.empty else {}
                return render_template('kimi.html', data=data, preview_data=first_row)
            except Exception as e:
                print(f"データの解析エラー: {str(e)}")
                return render_template('kimi.html', data=data, preview_data={})
    elif request.method == 'POST':
        # フォームデータを取得
        font_name = request.form.get('font_name', 'NotoSansJP')  # デフォルト値を設定
        font_size = int(request.form.get('font_size', 12))  # デフォルト値を設定
        text_color = request.form.get('text_color', '#000000')  # デフォルト値を設定
        background_color = request.form.get('background_color', '#ffffff')  # デフォルト値を設定
        alignment = request.form.get('alignment', 'LEFT')  # デフォルト値を設定
        card_width = int(request.form.get('card_width', 100))  # デフォルト値を設定
        card_height = int(request.form.get('card_height', 67))  # デフォルト値を設定
        line_spacing = float(request.form.get('line_spacing', 1.5))  # デフォルト値を設定
        output_format = request.form.get('output_format', 'pdf')  # デフォルト値を設定

        design_settings = {
            'font_name': font_name,
            'font_size': font_size,
            'text_color': text_color,
            'background_color': background_color,
            'alignment': alignment,
            'card_width': card_width,
            'card_height': card_height,
            'line_spacing': line_spacing,
            'output_format': output_format,
            '1_x': int(request.form.get('1_x', 50)),
            '1_y': int(request.form.get('1_y', 50)),
            '2_x': int(request.form.get('2_x', 50)),
            '2_y': int(request.form.get('2_y', 100)),
            '3_x': int(request.form.get('3_x', 50)),
            '3_y': int(request.form.get('3_y', 150)),
            '4_x': int(request.form.get('4_x', 50)),
            '4_y': int(request.form.get('4_y', 200)),
            '5_x': int(request.form.get('5_x', 50)),
            '5_y': int(request.form.get('5_y', 250)),
            '6_x': int(request.form.get('4_x', 50)),
            '6_y': int(request.form.get('4_y', 200)),
            '7_x': int(request.form.get('4_x', 50)),
            '7_y': int(request.form.get('4_y', 200)),
            '8_x': int(request.form.get('4_x', 50)),
            '8_y': int(request.form.get('4_y', 200)),
            '9_x': int(request.form.get('4_x', 50)),
            '9_y': int(request.form.get('4_y', 200)),
            '10_x': int(request.form.get('4_x', 50)),
            '10_y': int(request.form.get('4_y', 200))
        }

        # 背景画像をアップロード
        if 'background_image' in request.files:
            background_image = request.files['background_image']
            if background_image.filename != '':
                background_image_path = os.path.join(app.config['UPLOAD_FOLDER'], background_image.filename)
                background_image.save(background_image_path)
                design_settings['background_image'] = background_image_path

        data = request.form['data']
        df = pd.read_json(data)

        # 出力形式に応じてファイルを生成
        if design_settings['output_format'] == 'pdf':
            pdf_buffer = generate_pdf(df, design_settings)
            return send_file(
                pdf_buffer,
                as_attachment=True,
                download_name='name_tags.pdf',
                mimetype='application/pdf'
            )
        elif design_settings['output_format'] == 'jpg':
            jpg_buffer = generate_preview(design_settings)
            return send_file(
                io.BytesIO(base64.b64decode(jpg_buffer)),
                as_attachment=True,
                download_name='name_tags.jpg',
                mimetype='image/jpeg'
            )
        elif design_settings['output_format'] == 'svg':
            svg_content = generate_svg(design_settings)
            return send_file(
                io.BytesIO(svg_content.encode('utf-8')),
                as_attachment=True,
                download_name='name_tags.svg',
                mimetype='image/svg+xml'
            )
    else:
        # GETリクエストの場合、デザイン設定フォームを表示
        data = request.args.get('data')
        return render_template('kimi.html', data=data)

@app.route('/preview', methods=['POST'])
def preview():
    # フォームから設定を取得
    font_name = request.form.get('font_name', 'NotoSansJP')  # デフォルト値を設定
    font_size = int(request.form.get('font_size', 12))  # デフォルト値を設定
    text_color = request.form.get('text_color', '#000000')  # デフォルト値を設定
    background_color = request.form.get('background_color', '#ffffff')  # デフォルト値を設定
    alignment = request.form.get('alignment', 'LEFT')  # デフォルト値を設定
    card_width = int(request.form.get('card_width', 100))  # デフォルト値を設定
    card_height = int(request.form.get('card_height', 67))  # デフォルト値を設定
    line_spacing = float(request.form.get('line_spacing', 1.5))  # デフォルト値を設定

    design_settings = {
        'font_name': font_name,
        'font_size': font_size,
        'text_color': text_color,
        'background_color': background_color,
        'alignment': alignment,
        'card_width': card_width,
        'card_height': card_height,
        'line_spacing': line_spacing,
        '1_x': int(request.form.get('1_x', 50)),
        '1_y': int(request.form.get('1_y', 50)),
        '2_x': int(request.form.get('2_x', 50)),
        '2_y': int(request.form.get('2_y', 100)),
        '3_x': int(request.form.get('3_x', 50)),
        '3_y': int(request.form.get('3_y', 150)),
        '4_x': int(request.form.get('4_x', 50)),
        '4_y': int(request.form.get('4_y', 200)),
        '5_x': int(request.form.get('5_x', 50)),
        '5_y': int(request.form.get('5_y', 250)),
        '6_x': int(request.form.get('6_x', 50)),
        '6_y': int(request.form.get('6_y', 200)),
        '7_x': int(request.form.get('7_x', 50)),
        '7_y': int(request.form.get('7_y', 200)),
        '8_x': int(request.form.get('8_x', 50)),
        '8_y': int(request.form.get('8_y', 200)),
        '9_x': int(request.form.get('9_x', 50)),
        '9_y': int(request.form.get('9_y', 200)),
        '10_x': int(request.form.get('10_x', 50)),
        '10_y': int(request.form.get('10_y', 200))
    }

    # 背景画像をアップロード
    if 'background_image' in request.files:
        background_image = request.files['background_image']
        if background_image.filename != '':
            background_image_path = os.path.join(app.config['UPLOAD_FOLDER'], background_image.filename)
            background_image.save(background_image_path)
            design_settings['background_image'] = background_image_path

    # プレビュー画像を生成
    preview_image = generate_preview(design_settings)

    # 画像をBase64エンコードして返す
    return jsonify({'preview_image': preview_image})

def generate_pdf(df, design_settings):
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

def generate_preview(design_settings):
    # プレビュー画像を生成するためのバッファ
    buffer = io.BytesIO()

    # 画像のサイズを設定（ミリメートルをピクセルに変換）
    dpi = 72  # DPI（解像度）を72に設定（一般的な画面解像度）
    card_width = int(design_settings['card_width'] * mm * dpi / 25.4)
    card_height = int(design_settings['card_height'] * mm * dpi / 25.4)

    # 画像の背景色を設定
    background_color = design_settings['background_color']
    image = PILImage.new('RGB', (card_width, card_height), background_color)
    image_draw = ImageDraw.Draw(image)  # 変数名を変更

    # 背景画像を適用
    if 'background_image' in design_settings:
        background_image_path = design_settings['background_image']
        background_image = PILImage.open(background_image_path)
        background_image = background_image.resize((card_width, card_height), PILImage.LANCZOS)  # ANTIALIASをLANCZOSに変更
        image.paste(background_image, (0, 0))

    # フォントの設定
    font_path = os.path.join(FONT_DIR, f"{design_settings['font_name']}.ttf")
    try:
        # フォントサイズをピクセルに変換
        font_size = int(design_settings['font_size'] * dpi / 25.4)
        font = ImageFont.truetype(font_path, font_size)
        print(f"フォントが正常に読み込まれました: {font_path}")
    except Exception as e:
        print(f"フォントの読み込みに失敗しました: {e}")
        # デフォルトのフォントを使用（日本語非対応）
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

    # トリムマークの描画（drawsvgの代わりにPILのDrawを使用）
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

    # 画像をバッファに保存
    image.save(buffer, format='JPEG')
    buffer.seek(0)

    # バッファをBase64エンコード
    preview_image = base64.b64encode(buffer.read()).decode('utf-8')
    return preview_image

def generate_svg(design_settings):
    # SVGドキュメントを作成
    dwg = svgwrite.Drawing(profile='tiny')

    # 背景色を設定
    dwg.add(dwg.rect(insert=(0, 0), size=(design_settings['card_width'], design_settings['card_height']), fill=design_settings['background_color']))

    # テキストを追加
    text_lines = [
        ("株式会社サンプル", design_settings['1_x'], design_settings['1_y']),
        ("営業部", design_settings['2_x'], design_settings['2_y']),
        ("山田太郎", design_settings['3_x'], design_settings['3_y']),
        ("Tel: 03-1234-5678", design_settings['4_x'], design_settings['4_y']),
        ("Email: yamada@example.com", design_settings['5_x'], design_settings['5_y'])
    ]
    for line, x_position, y_position in text_lines:
        dwg.add(dwg.text(line, insert=(x_position, y_position), fill=design_settings['text_color'], font_size=f"{design_settings['font_size']}pt"))

    # SVGファイルを保存
    svg_buffer = io.StringIO()
    dwg.write(svg_buffer)
    svg_buffer.seek(0)
    return svg_buffer.getvalue()

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)