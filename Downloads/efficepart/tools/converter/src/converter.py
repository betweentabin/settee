from PIL import Image
from pdf2image import convert_from_path
import img2pdf
import os
from typing import List, Union, Optional
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

class FileConverter:
    def __init__(self):
        self.supported_image_formats = ['.jpg', '.jpeg', '.png', '.tiff', '.tif']
        self.supported_pdf_format = '.pdf'
        self.supported_vector_formats = ['.svg', '.ai']
        
        self.format_map = {
            'jpg': 'JPEG',
            'jpeg': 'JPEG',
            'png': 'PNG',
            'tiff': 'TIFF',
            'tif': 'TIFF',
            'pdf': 'PDF'  # 追加
        }
    
    def convert_vector_to_image(
        self, 
        input_path: str, 
        output_path: str, 
        output_format: str,
        dpi: int = 300
    ) -> str:
        """ベクター形式（SVG/AI）を画像に変換する"""
        try:
            input_ext = os.path.splitext(input_path)[1].lower()
            
            # 出力形式が正しく設定されていることを確認
            print(f"Converting vector to {output_format}")
            
            if output_format == 'pdf':
                # ベクターからPDFへの変換
                if input_ext == '.svg':
                    # SVGをPNGに変換
                    drawing = svg2rlg(input_path)
                    temp_png = output_path.replace('.pdf', '.png')
                    scale = dpi / 72.0
                    renderPM.drawToFile(drawing, temp_png, fmt="PNG", dpi=dpi, scale=scale)
                    # PNGをPDFに変換
                    self.convert_images_to_pdf([temp_png], output_path)
                    os.remove(temp_png)
                elif input_ext == '.ai':
                    # AIはすでにPDF互換なのでコピーする
                    import shutil
                    shutil.copy2(input_path, output_path)
                return output_path
            
            if input_ext == '.svg':
                # SVGを画像に変換
                drawing = svg2rlg(input_path)
                # 一時的にPNGとして保存
                temp_png = output_path.replace(f'.{output_format}', '.png')
                # DPIに基づいてサイズを調整
                scale = dpi / 72.0  # SVGのデフォルトDPIは72
                renderPM.drawToFile(
                    drawing, 
                    temp_png, 
                    fmt="PNG", 
                    dpi=dpi,
                    scale=scale
                )
                
                if output_format != 'png':
                    # 他の形式に変換
                    with Image.open(temp_png) as img:
                        img.save(output_path, format=self.format_map[output_format])
                    os.remove(temp_png)
                else:
                    os.rename(temp_png, output_path)
                    
            elif input_ext == '.ai':
                # AIファイルをPDFとして読み込み、画像に変換
                temp_pdf = input_path + '.pdf'
                if not os.path.exists(temp_pdf):
                    temp_pdf = input_path  # AIファイルが既にPDF互換の場合
                
                images = convert_from_path(temp_pdf, dpi=dpi)
                if images:
                    images[0].save(
                        output_path,
                        format=self.format_map.get(output_format, 'JPEG')
                    )
            
            return output_path
            
        except Exception as e:
            raise Exception(f"ベクター変換エラー: {str(e)}")

    def convert_pdf_to_images(
        self, 
        pdf_path: str, 
        output_format: str = 'jpg',
        dpi: int = 200,
        output_dir: Optional[str] = None
    ) -> List[str]:
        """PDFを画像に変換する

        Args:
            pdf_path: PDFファイルのパス
            output_format: 出力フォーマット（jpg/png/tiff）
            dpi: 解像度
            output_dir: 出力ディレクトリ

        Returns:
            生成された画像ファイルのパスリスト
        """
        try:
            # 出力形式の確認
            print(f"Converting PDF to {output_format}")
            
            # PDFを画像に変換
            images = convert_from_path(pdf_path, dpi=dpi)
            
            # 出力ディレクトリの設定
            if output_dir is None:
                output_dir = os.path.dirname(pdf_path)
            os.makedirs(output_dir, exist_ok=True)
            
            # 画像の保存
            output_paths = []
            base_filename = os.path.splitext(os.path.basename(pdf_path))[0]
            
            for i, image in enumerate(images):
                output_path = os.path.join(
                    output_dir, 
                    f"{base_filename}_page{i+1}.{output_format}"
                )
                image.save(
                    output_path,
                    format=self.format_map.get(output_format, 'JPEG')
                )
                output_paths.append(output_path)
            
            return output_paths
            
        except Exception as e:
            raise Exception(f"PDF変換エラー: {str(e)} - PDFファイル: {pdf_path}")

    def convert_images_to_pdf(
        self, 
        image_paths: List[str], 
        output_path: str
    ) -> str:
        """画像をPDFに変換する

        Args:
            image_paths: 画像ファイルのパスリスト
            output_path: 出力PDFのパス

        Returns:
            生成されたPDFのパス
        """
        try:
            print(f"Converting image(s) to PDF: {image_paths}")
            # 画像をPDFに変換
            with open(output_path, "wb") as f:
                f.write(img2pdf.convert(image_paths))
            return output_path
            
        except Exception as e:
            raise Exception(f"画像→PDF変換エラー: {str(e)}")

    def convert_image_format(self, input_path: str, output_path: str, output_format: str) -> str:
        """画像形式を変換する"""
        try:
            print(f"Converting image to {output_format}: {input_path} -> {output_path}")
            
            if output_format == 'pdf':
                # 画像をPDFに変換
                return self.convert_images_to_pdf([input_path], output_path)
            
            with Image.open(input_path) as img:
                if img.mode in ('RGBA', 'LA') or \
                   (img.mode == 'P' and 'transparency' in img.info):
                    # PDFはアルファチャンネルをサポートしないのでRGBに変換
                    img = img.convert('RGB')
                
                save_format = self.format_map.get(output_format.lower())
                if not save_format:
                    raise ValueError(f"未対応の出力フォーマット: {output_format}")
                
                img.save(output_path, format=save_format)
                return output_path
            
        except Exception as e:
            raise Exception(f"画像変換エラー: {str(e)}")