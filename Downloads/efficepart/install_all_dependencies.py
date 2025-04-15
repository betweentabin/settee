#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive script to install all required dependencies for the Efficiency Expert Web Application.
This script will:
1. Install all required Python packages
2. Apply necessary patches for Python 3.12 compatibility
3. Verify that all modules can be imported correctly
4. Create necessary directories and symlinks
"""

import os
import sys
import subprocess
import importlib
import logging
import site
import shutil
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# List of all required packages with versions
REQUIRED_PACKAGES = [
    # Core Flask packages
    'flask==2.3.3',
    'flask-cors==4.0.0',
    'flask-login==0.6.2',
    'flask-sqlalchemy==3.1.1',
    'flask-session==0.5.0',
    'werkzeug==2.3.7',
    'python-dotenv==1.0.0',
    'cachelib==0.13.0',
    'msgspec==0.19.0',
    
    # TOC Generator dependencies
    'python-pptx==0.6.21',
    'lxml>=3.1.0',
    'pillow>=3.3.2',
    'xlsxwriter>=0.5.7',
    
    # PDF Tool dependencies
    'pypdf2==3.0.1',
    
    # Shift Tool dependencies
    'openpyxl>=3.0.0',
    'et-xmlfile>=1.0.1',
    
    # Additional useful packages
    'requests>=2.28.0',
    'jinja2>=3.1.2',
    'itsdangerous>=2.1.2',
    'click>=8.1.3',
    'blinker>=1.6.2',
    'markupsafe>=2.1.1',
    'sqlalchemy>=2.0.16',
    'typing-extensions>=4.5.0'
]

# List of modules to verify imports
MODULES_TO_VERIFY = [
    'flask',
    'flask_cors',
    'flask_login',
    'flask_sqlalchemy',
    'flask_session',
    'werkzeug',
    'dotenv',
    'cachelib',
    'msgspec',
    'pptx',
    'lxml',
    'PIL',
    'xlsxwriter',
    'PyPDF2',
    'openpyxl',
    'requests',
    'jinja2',
    'itsdangerous',
    'click',
    'blinker',
    'markupsafe',
    'sqlalchemy',
    'typing_extensions'
]

def install_package(package):
    """Install a single package using pip."""
    logger.info(f"Installing {package}...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
        logger.info(f"Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install {package}: {e}")
        return False

def install_all_packages():
    """Install all required packages."""
    success = True
    for package in REQUIRED_PACKAGES:
        if not install_package(package):
            success = False
    return success

def verify_module_import(module_name):
    """Verify that a module can be imported."""
    try:
        importlib.import_module(module_name)
        logger.info(f"Successfully imported {module_name}")
        return True
    except ImportError as e:
        logger.error(f"Failed to import {module_name}: {e}")
        return False

def verify_all_imports():
    """Verify that all required modules can be imported."""
    success = True
    for module in MODULES_TO_VERIFY:
        if not verify_module_import(module):
            success = False
    return success

def patch_pptx_for_python312():
    """Patch the python-pptx package for Python 3.12 compatibility."""
    # Find the pptx module
    try:
        import pptx
        pptx_path = os.path.dirname(pptx.__file__)
        compat_init_path = os.path.join(pptx_path, 'compat', '__init__.py')
        
        # Create a backup if it doesn't exist
        backup_path = f"{compat_init_path}.bak"
        if not os.path.exists(backup_path):
            with open(compat_init_path, 'r') as f:
                original_content = f.read()
            with open(backup_path, 'w') as f:
                f.write(original_content)
            logger.info(f"Created backup at {backup_path}")
        
        # Write the patched content
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
        
        with open(compat_init_path, 'w') as f:
            f.write(patched_content)
        
        logger.info(f"Successfully patched {compat_init_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to patch python-pptx: {e}")
        return False

def create_symlinks_for_pptx():
    """Create symlinks for the pptx module in all tool directories."""
    try:
        # Find the pptx module
        import pptx
        pptx_path = os.path.dirname(pptx.__file__)
        
        # Get the project root directory
        root_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Find all tool directories
        tools_dir = os.path.join(root_dir, 'tools')
        if not os.path.exists(tools_dir):
            logger.error(f"Tools directory not found: {tools_dir}")
            return False
        
        tool_dirs = [os.path.join(tools_dir, d) for d in os.listdir(tools_dir) 
                    if os.path.isdir(os.path.join(tools_dir, d))]
        
        for tool_dir in tool_dirs:
            # Create a symlink in each tool directory
            target_dir = os.path.join(tool_dir, 'pptx')
            if os.path.exists(target_dir):
                if os.path.islink(target_dir):
                    os.unlink(target_dir)
                else:
                    shutil.rmtree(target_dir)
            
            # Create the symlink
            os.symlink(pptx_path, target_dir)
            logger.info(f"Created symlink: {pptx_path} -> {target_dir}")
        
        logger.info("All symlinks created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to create symlinks: {e}")
        return False

def ensure_upload_directories():
    """Ensure that all necessary upload directories exist."""
    try:
        # Get the project root directory
        root_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Create upload directories
        upload_dirs = [
            os.path.join(root_dir, 'uploads'),
            os.path.join(root_dir, 'tools', 'TOC', 'uploads'),
            os.path.join(root_dir, 'tools', 'pdf', 'uploads'),
            os.path.join(root_dir, 'tools', 'shift', 'uploads'),
            os.path.join(root_dir, 'static', 'uploads')
        ]
        
        for upload_dir in upload_dirs:
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
                logger.info(f"Created upload directory: {upload_dir}")
        
        logger.info("All upload directories created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to create upload directories: {e}")
        return False

def main():
    """Main function."""
    logger.info("Starting installation of all dependencies...")
    
    # Step 1: Install all required packages
    logger.info("Step 1: Installing all required packages...")
    if not install_all_packages():
        logger.error("Failed to install all required packages")
        return 1
    
    # Step 2: Patch python-pptx for Python 3.12 compatibility
    logger.info("Step 2: Patching python-pptx for Python 3.12 compatibility...")
    if not patch_pptx_for_python312():
        logger.error("Failed to patch python-pptx")
        return 1
    
    # Step 3: Verify all imports
    logger.info("Step 3: Verifying all imports...")
    if not verify_all_imports():
        logger.error("Failed to verify all imports")
        return 1
    
    # Step 4: Create symlinks for pptx
    logger.info("Step 4: Creating symlinks for pptx...")
    if not create_symlinks_for_pptx():
        logger.error("Failed to create symlinks for pptx")
        return 1
    
    # Step 5: Ensure upload directories
    logger.info("Step 5: Ensuring upload directories...")
    if not ensure_upload_directories():
        logger.error("Failed to ensure upload directories")
        return 1
    
    logger.info("All dependencies installed and configured successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
