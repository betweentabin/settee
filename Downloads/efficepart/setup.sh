#!/bin/bash
# epwebのセットアップスクリプト
# このスクリプトは必要なパッケージのインストールとpython-pptxのパッチ適用を行います

echo "epwebのセットアップを開始します..."

# 現在のディレクトリを確認
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# 仮想環境の作成（オプション）
if [ "$1" == "--venv" ]; then
    echo "仮想環境を作成します..."
    python -m venv venv
    source venv/bin/activate
    echo "仮想環境が有効化されました"
fi

# 依存パッケージのインストール
echo "依存パッケージをインストールしています..."
pip install -r requirements.txt

# python-pptxのパッチを適用
echo "python-pptxにパッチを適用しています..."
python pptx_compat_patch.py

# セットアップ完了メッセージ
echo "セットアップが完了しました！"
echo "アプリケーションを起動するには以下のコマンドを実行してください："
echo "python app.py"
echo "その後、ブラウザで http://localhost:5001 にアクセスしてください"
