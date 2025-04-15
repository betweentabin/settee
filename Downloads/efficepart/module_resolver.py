#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module Resolver - 依存関係とパス解決の中心モジュール
このモジュールは、すべてのインポートを正しく解決するためのパス設定と環境構築を行います。
"""

import os
import sys
import site
import logging
import importlib
from pathlib import Path
import inspect
import tempfile
import shutil

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# 初期化状態を追跡
_initialized = False
_tool_environments = set()  # 既に設定されたツール環境を追跡
logger = logging.getLogger('module_resolver')

# すべての必要なライブラリのリスト
REQUIRED_MODULES = [
    'flask',
    'flask_cors',
    'pptx',
    'lxml',
    'PIL',
    'PyPDF2',
    'openpyxl',
    'xlsxwriter',
]

def get_project_root():
    """プロジェクトのルートディレクトリを取得する"""
    # このファイルの場所からプロジェクトルートを決定
    return Path(os.path.dirname(os.path.abspath(__file__)))

def add_project_root_to_path():
    """プロジェクトルートをPythonパスに追加"""
    root_dir = str(get_project_root())
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
        logger.info(f"Added project root directory {root_dir} to path")
    return root_dir

def add_tools_to_path():
    """toolsディレクトリとそのサブディレクトリをPythonパスに追加"""
    root_dir = get_project_root()
    tools_dir = os.path.join(root_dir, 'tools')
    
    if os.path.exists(tools_dir) and tools_dir not in sys.path:
        sys.path.insert(0, tools_dir)
        logger.info(f"Added tools directory {tools_dir} to path")
    
    # 各ツールディレクトリを追加
    for tool_dir in os.listdir(tools_dir):
        full_tool_dir = os.path.join(tools_dir, tool_dir)
        if os.path.isdir(full_tool_dir) and full_tool_dir not in sys.path:
            sys.path.insert(0, full_tool_dir)
            logger.debug(f"Added tool directory {full_tool_dir} to path")
            
            # バックエンドディレクトリがあれば追加
            backend_dir = os.path.join(full_tool_dir, 'backend')
            if os.path.exists(backend_dir) and os.path.isdir(backend_dir):
                sys.path.insert(0, backend_dir)
                logger.debug(f"Added backend directory {backend_dir} to path")
    
    return tools_dir

def add_site_packages_to_path():
    """site-packagesディレクトリをPythonパスに追加"""
    site_packages = site.getsitepackages()
    for pkg_dir in site_packages:
        if pkg_dir not in sys.path:
            sys.path.append(pkg_dir)
            logger.debug(f"Added site-packages directory {pkg_dir} to path")

def check_module_availability(module_name):
    """モジュールが利用可能かどうかを確認"""
    try:
        importlib.import_module(module_name)
        logger.debug(f"Module {module_name} is available")
        return True
    except ImportError:
        logger.warning(f"Module {module_name} is NOT available")
        return False

def check_required_modules():
    """必要なすべてのモジュールが利用可能かどうかを確認"""
    missing_modules = []
    for module in REQUIRED_MODULES:
        if not check_module_availability(module):
            missing_modules.append(module)
    
    if missing_modules:
        logger.warning(f"Missing required modules: {', '.join(missing_modules)}")
        return False
    else:
        logger.info("All required modules are available")
        return True

def create_temp_pptx_symlinks():
    """pptxモジュールへの一時的なシンボリックリンクを作成"""
    try:
        # pptxモジュールのパスを取得
        import pptx
        pptx_path = os.path.dirname(pptx.__file__)
        
        # 現在のスクリプトの呼び出し元を取得
        caller_frame = inspect.stack()[1]
        caller_file = caller_frame.filename
        caller_dir = os.path.dirname(os.path.abspath(caller_file))
        
        # 呼び出し元ディレクトリにpptxへのシンボリックリンクを作成
        target_path = os.path.join(caller_dir, 'pptx')
        
        # 既存のリンクを削除（存在する場合）
        if os.path.exists(target_path):
            if os.path.islink(target_path):
                # If the symlink already exists and points to the correct location, skip
                if os.path.realpath(target_path) == os.path.realpath(pptx_path):
                    logger.debug(f"Symlink already exists and points to the correct location: {target_path}")
                    return target_path
                os.unlink(target_path)
            elif os.path.isdir(target_path):
                # ディレクトリの場合は一時的なシンボリックリンクはスキップ
                logger.debug(f"Directory already exists at {target_path}, skipping symlink creation")
                return target_path
        
        # シンボリックリンクを作成
        os.symlink(pptx_path, target_path, target_is_directory=True)
        logger.debug(f"Created temporary symlink: {pptx_path} -> {target_path}")
        
        return target_path
    except Exception as e:
        logger.error(f"Failed to create temporary pptx symlink: {e}")
        # Even if symlink creation fails, we can still continue if the module is importable
        try:
            import pptx
            logger.info("pptx module is importable despite symlink creation failure")
            return None
        except ImportError:
            logger.error("pptx module is not importable")
            return None

def copy_pptx_to_tools():
    """pptxモジュールをツールディレクトリにコピー"""
    try:
        # pptxモジュールのパスを取得
        import pptx
        pptx_path = os.path.dirname(pptx.__file__)
        
        # プロジェクトルートとツールディレクトリを取得
        root_dir = get_project_root()
        tools_dir = os.path.join(root_dir, 'tools')
        
        # 各ツールディレクトリを処理
        for tool_dir_name in os.listdir(tools_dir):
            tool_dir = os.path.join(tools_dir, tool_dir_name)
            if os.path.isdir(tool_dir):
                # ツールディレクトリ内のpptxディレクトリパス
                target_path = os.path.join(tool_dir, 'pptx')
                
                # 既存のリンクを削除（存在する場合）
                if os.path.exists(target_path):
                    if os.path.islink(target_path):
                        # If it's a symlink pointing to the right place, keep it
                        if os.path.realpath(target_path) == os.path.realpath(pptx_path):
                            logger.debug(f"Symlink already exists and points to the correct location: {target_path}")
                            continue
                        os.unlink(target_path)
                    elif os.path.isdir(target_path):
                        # If it's a directory, check if it's a copy of the pptx module
                        # For simplicity, we'll just check if a few key files exist
                        if (os.path.exists(os.path.join(target_path, '__init__.py')) and
                            os.path.exists(os.path.join(target_path, 'presentation.py'))):
                            logger.debug(f"pptx directory already exists at {target_path}, skipping copy")
                            continue
                        # Otherwise, remove it to make way for a fresh copy
                        shutil.rmtree(target_path)
                
                try:
                    # pptxディレクトリをコピー
                    shutil.copytree(pptx_path, target_path)
                    logger.info(f"Copied pptx module to {target_path}")
                except FileExistsError:
                    logger.debug(f"Directory already exists at {target_path}")
                except Exception as e:
                    logger.warning(f"Could not copy pptx to {tool_dir}: {e}")
        
        return True
    except Exception as e:
        logger.error(f"Failed to copy pptx module to tools: {e}")
        return False

def apply_pptx_compat_patch():
    """pptxモジュールにPython 3.12互換性パッチを適用"""
    try:
        # pptxモジュールのパスを取得
        import pptx
        pptx_path = os.path.dirname(pptx.__file__)
        compat_init_path = os.path.join(pptx_path, 'compat', '__init__.py')
        
        # 互換性パッチの内容
        patched_content = '''# encoding: utf-8

"""Provides Python 2/3 compatibility objects."""

import sys
import collections.abc

# Always use collections.abc in Python 3
Container = collections.abc.Container
Mapping = collections.abc.Mapping
Sequence = collections.abc.Sequence

if sys.version_info >= (3, 0):
    from .python3 import (  # noqa
        BytesIO,
        is_integer,
        is_string,
        is_unicode,
        to_unicode,
        Unicode,
    )
else:
    from .python2 import (  # noqa
        BytesIO,
        is_integer,
        is_string,
        is_unicode,
        to_unicode,
        Unicode,
    )
'''
        
        # バックアップを作成（まだ存在しない場合）
        backup_path = f"{compat_init_path}.bak"
        if not os.path.exists(backup_path):
            with open(compat_init_path, 'r') as f:
                original_content = f.read()
            with open(backup_path, 'w') as f:
                f.write(original_content)
            logger.info(f"Created backup at {backup_path}")
        
        # パッチ適用
        with open(compat_init_path, 'w') as f:
            f.write(patched_content)
        
        logger.info(f"Applied Python 3.12 compatibility patch to {compat_init_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to apply pptx compatibility patch: {e}")
        return False

def create_all_necessary_symlinks():
    """
    Create all necessary symlinks for special modules in all tool directories.
    
    Returns:
        bool: True if all symlinks were created successfully, False otherwise
    """
    logger.info("Creating all necessary symlinks for tools")
    try:
        # Get the project root directory
        root_dir = get_project_root()
        
        # Find all tool directories
        tools_dir = os.path.join(root_dir, 'tools')
        if not os.path.exists(tools_dir):
            logger.error(f"Tools directory not found: {tools_dir}")
            return False
        
        # Try to import pptx
        try:
            import pptx
            pptx_path = os.path.dirname(pptx.__file__)
            
            # Create symlinks in each tool directory
            for tool_dir_name in os.listdir(tools_dir):
                tool_dir = os.path.join(tools_dir, tool_dir_name)
                if os.path.isdir(tool_dir):
                    # Create symlink for pptx
                    target_dir = os.path.join(tool_dir, 'pptx')
                    if os.path.exists(target_dir):
                        if os.path.islink(target_dir):
                            # If the symlink already exists and points to the correct location, skip
                            if os.path.realpath(target_dir) == os.path.realpath(pptx_path):
                                logger.debug(f"Symlink already exists and points to the correct location: {target_dir}")
                                continue
                            os.unlink(target_dir)
                        elif os.path.isdir(target_dir):
                            # If it's a directory and not a symlink, we'll keep it as is
                            logger.debug(f"Directory already exists at {target_dir}, skipping symlink creation")
                            continue
                    
                    try:
                        # Create the symlink
                        os.symlink(pptx_path, target_dir, target_is_directory=True)
                        logger.info(f"Created symlink: {pptx_path} -> {target_dir}")
                    except FileExistsError:
                        logger.debug(f"Symlink already exists: {target_dir}")
                    except Exception as e:
                        logger.warning(f"Could not create symlink in {tool_dir}: {e}")
            
            logger.info("All symlinks created successfully")
            return True
        except ImportError:
            logger.warning("Could not import pptx, skipping symlink creation")
            return False
    except Exception as e:
        logger.error(f"Failed to create symlinks: {e}")
        return False

def setup_tool_environment(tool_name=None):
    """
    Set up the environment for a specific tool.
    
    Args:
        tool_name (str, optional): Name of the tool. If None, will try to determine from the calling module.
        
    Returns:
        bool: True if the environment was set up successfully, False otherwise
    """
    logger.info(f"Setting up environment for tool: {tool_name}")
    
    # Add project root to path
    root_dir = add_project_root_to_path()
    
    # Add tools directory to path
    tools_dir = add_tools_to_path()
    
    # Add site packages to path
    add_site_packages_to_path()
    
    # Create temporary symlinks for pptx if needed
    if tool_name and tool_name.lower() in ['toc']:
        try:
            create_temp_pptx_symlinks()
        except Exception as e:
            logger.warning(f"Could not create pptx symlinks: {e}")
    
    # Check required modules
    modules_ok = check_required_modules()
    
    return modules_ok

def init_module_resolver():
    """モジュールリゾルバを初期化"""
    # プロジェクトルートをパスに追加
    root_dir = add_project_root_to_path()
    
    # toolsディレクトリをパスに追加
    tools_dir = add_tools_to_path()
    
    # site-packagesをパスに追加
    add_site_packages_to_path()
    
    # pptxのPython 3.12互換性パッチを適用
    apply_pptx_compat_patch()
    
    # pptxモジュールをツールディレクトリにコピー
    copy_pptx_to_tools()
    
    # 必要なモジュールを確認
    check_required_modules()
    
    return {
        'root_dir': root_dir,
        'tools_dir': tools_dir,
        'python_path': sys.path[:],
    }

# モジュールがインポートされたときにリゾルバを初期化
init_result = init_module_resolver()
