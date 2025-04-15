#!/usr/bin/env python3
"""
シンプルなfaviconを生成するスクリプト
"""
from PIL import Image, ImageDraw, ImageFont
import os

# 16x16ピクセルの画像を作成
img = Image.new('RGBA', (32, 32), color=(255, 255, 255, 0))
draw = ImageDraw.Draw(img)

# 背景を描画
draw.rectangle([(0, 0), (32, 32)], fill=(0, 102, 204))

# 'EP'の文字を描画
# フォントがない場合は単純な図形で代用
draw.rectangle([(8, 8), (24, 24)], fill=(255, 255, 255))
draw.rectangle([(10, 10), (22, 22)], fill=(0, 102, 204))

# ICOファイルとして保存
img.save('static/favicon.ico', format='ICO')

print("Favicon created successfully!")
