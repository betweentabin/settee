import pytest
from app import secure_filename, validate_pdf_file, encrypt_data, decrypt_data
import io

def test_secure_filename():
    # 正常系テスト
    assert secure_filename('test.pdf').endswith('.pdf')
    assert secure_filename('test.txt').endswith('.txt')
    assert secure_filename('test.csv').endswith('.csv')
    
    # 異常系テスト
    assert secure_filename('test.exe') is None  # 許可されていない拡張子
    assert secure_filename('') is None  # 空のファイル名
    assert secure_filename(None) is None  # Noneの場合

def test_validate_pdf_file():
    # 正常系テスト - 有効なPDFファイル
    valid_pdf = io.BytesIO(b'%PDF-1.4\n')
    valid_pdf.filename = 'test.pdf'
    assert validate_pdf_file(valid_pdf) is True
    
    # 異常系テスト - 無効なファイル
    invalid_file = io.BytesIO(b'not a pdf')
    invalid_file.filename = 'test.pdf'
    assert validate_pdf_file(invalid_file) is False
    
    # 異常系テスト - PDFではない拡張子
    not_pdf = io.BytesIO(b'%PDF-1.4\n')
    not_pdf.filename = 'test.txt'
    assert validate_pdf_file(not_pdf) is False

def test_encryption():
    # 正常系テスト - 文字列の暗号化と復号
    original_data = "テストデータ"
    encrypted = encrypt_data(original_data)
    decrypted = decrypt_data(encrypted)
    assert decrypted == original_data
    
    # 異常系テスト - バイト列の暗号化と復号
    original_bytes = b"test data"
    encrypted = encrypt_data(original_bytes)
    decrypted = decrypt_data(encrypted)
    assert decrypted == original_bytes.decode() 