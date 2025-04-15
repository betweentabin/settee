#!/bin/bash

# エラーが発生した場合にスクリプトを停止
set -e

# 環境変数の読み込み
if [ -f .env ]; then
    source .env
fi

# 必要な環境変数のチェック
if [ -z "$DEPLOY_ENV" ]; then
    echo "Error: DEPLOY_ENV is not set"
    exit 1
fi

echo "Deploying to $DEPLOY_ENV environment..."

# バックアップの作成
echo "Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="backups/$timestamp"
mkdir -p $backup_dir
cp -r {static,templates,uploads,sessions} $backup_dir/ 2>/dev/null || true

# データベースのバックアップ（本番環境の場合）
if [ "$DEPLOY_ENV" = "production" ]; then
    echo "Backing up database..."
    docker-compose exec db pg_dump -U user app_db > "$backup_dir/database.sql"
fi

# アプリケーションの停止
echo "Stopping application..."
docker-compose down

# 新しいイメージのプル
echo "Pulling new images..."
docker-compose pull

# データベースマイグレーション（必要な場合）
if [ -f "migrations/migrate.py" ]; then
    echo "Running database migrations..."
    docker-compose run --rm web python migrations/migrate.py
fi

# アプリケーションの起動
echo "Starting application..."
docker-compose up -d

# ヘルスチェック
echo "Performing health check..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:5007/health; then
        echo "Application is healthy!"
        break
    fi
    echo "Waiting for application to become healthy... (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "Error: Application failed to become healthy"
    # ロールバック処理
    echo "Rolling back to previous version..."
    docker-compose down
    cp -r $backup_dir/* .
    if [ "$DEPLOY_ENV" = "production" ]; then
        docker-compose exec db psql -U user app_db < "$backup_dir/database.sql"
    fi
    docker-compose up -d
    exit 1
fi

# 古いバックアップの削除（30日以上前のもの）
find backups/ -type d -mtime +30 -exec rm -rf {} \;

echo "Deployment completed successfully!" 