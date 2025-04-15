import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index_route(client):
    # インデックスページのテスト
    response = client.get('/')
    assert response.status_code == 200

def test_404_handler(client):
    # 存在しないページへのアクセスのテスト
    response = client.get('/nonexistent')
    assert response.status_code == 404
    # APIリクエストの場合
    response = client.get('/api/nonexistent', headers={'Accept': 'application/json'})
    assert response.status_code == 404
    assert response.content_type == 'application/json'

def test_500_handler(client):
    # サーバーエラーのテスト
    # Note: 実際のエラーを発生させるためには、アプリケーション内で
    # エラーを発生させるエンドポイントを作成する必要があります
    pass

def test_security_headers(client):
    # セキュリティヘッダーのテスト
    response = client.get('/')
    assert 'X-Content-Type-Options' in response.headers
    assert response.headers['X-Content-Type-Options'] == 'nosniff'
    assert 'X-Frame-Options' in response.headers
    assert response.headers['X-Frame-Options'] == 'SAMEORIGIN'
    assert 'X-XSS-Protection' in response.headers
    assert response.headers['X-XSS-Protection'] == '1; mode=block'
    assert 'Content-Security-Policy' in response.headers 