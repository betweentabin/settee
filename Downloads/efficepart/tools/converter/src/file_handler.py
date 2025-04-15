import os
from typing import List, Tuple
import magic  # ファイルタイプの検出に使用

class FileHandler:
    def __init__(self):
        self.supported_formats = {
            'images': ['.jpg', '.jpeg', '.png', '.tiff', '.tif'],
            'pdf': ['.pdf'],
            'vector': ['.svg', '.ai']  # ベクター形式を追加
        }
    
    def validate_file(self, file_path: str) -> Tuple[bool, str]:
        """ファイルの有効性を確認する

        Args:
            file_path: チェックするファイルパス

        Returns:
            (有効かどうか, ファイルタイプ)
        """
        if not os.path.exists(file_path):
            return False, "ファイルが存在しません"
            
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            mime = magic.Magic(mime=True)
            file_type = mime.from_file(file_path)
            print(f"MIME type for {file_path}: {file_type}")
        except Exception as e:
            print(f"MIME detection error: {str(e)}")
            file_type = "unknown"
        
        # 画像形式の判定
        if ext in ['.jpg', '.jpeg', '.png', '.tiff', '.tif']:
            return True, "image"
        # PDF判定
        elif ext == '.pdf':
            return True, "pdf"
        # SVG判定
        elif ext == '.svg' or (file_type and 'svg' in file_type):
            return True, "vector"
        # AI判定（通常はPDFとして保存されている）
        elif ext == '.ai' and (file_type and ('pdf' in file_type or 'illustrator' in file_type)):
            return True, "vector"
        else:
            return False, f"未対応のファイル形式です: {ext} (MIME: {file_type})"
    
    def get_files_in_directory(
        self, 
        directory: str, 
        file_type: str = None
    ) -> List[str]:
        """指定ディレクトリ内の対象ファイルを取得する

        Args:
            directory: 検索するディレクトリ
            file_type: ファイルタイプ（"images" or "pdf"）

        Returns:
            ファイルパスのリスト
        """
        files = []
        for file in os.listdir(directory):
            file_path = os.path.join(directory, file)
            if not os.path.isfile(file_path):
                continue
                
            ext = os.path.splitext(file)[1].lower()
            if file_type and ext in self.supported_formats.get(file_type, []):
                files.append(file_path)
                
        return files