#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import os

def main():
    """
    サンプルのPythonスクリプト
    JSONレスポンスを返します
    """
    # リクエストデータの読み込み
    if len(sys.argv) > 1:
        request_file = sys.argv[1]
        if os.path.exists(request_file):
            with open(request_file, 'r') as f:
                try:
                    request_data = json.load(f)
                except json.JSONDecodeError:
                    request_data = {}
        else:
            request_data = {}
    else:
        request_data = {}

    # レスポンスの作成
    response = {
        'status': 'success',
        'message': 'Hello from Python!',
        'received_data': request_data
    }

    # JSONレスポンスを出力
    print(json.dumps(response, ensure_ascii=False))

if __name__ == "__main__":
    main() 