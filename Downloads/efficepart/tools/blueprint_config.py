#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Blueprint設定ファイル
各Blueprintのポート設定を管理します。
"""

# 各Blueprintのポート設定
BLUEPRINT_PORTS = {
    'main': 8000,         # メインアプリケーション
    'toc': 8001,          # 目次生成ツール
    'pdf': 8002,          # PDF処理ツール
    'shift': 8003,        # シフト管理ツール
    'nametag': 8004,      # 名札ツール
    'nametag_generator': 8004,  # 名札生成ツール（同じポートで共有）
    'transfer': 8005,     # ファイル転送ツール
    'gigafile': 8006,     # 大容量ファイル転送ツール
    'howto': 8007,        # 使い方ガイド
    'proofreading': 8008, # 校正ツール
    'converter': 8009     # 変換ツール
}

# Blueprintのルートパス
BLUEPRINT_PATHS = {
    'main': '/',
    'toc': '/toc',
    'pdf': '/pdf',
    'shift': '/shift',
    'nametag': '/nametag',
    'nametag_generator': '/nametag_generator',
    'transfer': '/transfer',
    'gigafile': '/gigafile',
    'howto': '/howto',
    'proofreading': '/proofreading',
    'converter': '/converter'
}

# 各Blueprintの表示名
BLUEPRINT_NAMES = {
    'main': 'メインアプリケーション',
    'toc': '目次生成',
    'pdf': 'PDF処理',
    'shift': 'シフト管理',
    'nametag': '名札ツール',
    'nametag_generator': '名札生成',
    'transfer': 'ファイル転送',
    'gigafile': '大容量ファイル転送',
    'howto': '使い方ガイド',
    'proofreading': '校正ツール',
    'converter': '変換ツール'
} 