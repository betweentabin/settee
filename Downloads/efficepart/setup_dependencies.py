#!/usr/bin/env python3
"""
This script ensures that all necessary dependencies are installed and accessible.
"""

import os
import sys
import subprocess
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# List of required packages
REQUIRED_PACKAGES = [
    'flask==2.3.3',
    'flask-cors==4.0.0',
    'flask-login==0.6.2',
    'flask-sqlalchemy==3.1.1',
    'flask-session==0.5.0',
    'python-pptx==0.6.21',
    'werkzeug==2.3.7',
    'python-dotenv==1.0.0',
    'cachelib==0.13.0',
    'msgspec==0.19.0',
    'lxml>=3.1.0',
    'pillow>=3.3.2',
    'xlsxwriter>=0.5.7',
    'pypdf2==3.0.1',
    'openpyxl>=3.0.0'
]

def install_packages():
    """Install all required packages."""
    for package in REQUIRED_PACKAGES:
        logger.info(f"Installing {package}...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            logger.info(f"Successfully installed {package}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install {package}: {e}")
            return False
    return True

def patch_pptx():
    """Patch the python-pptx package for Python 3.12 compatibility."""
    patch_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pptx_compat_patch.py')
    if not os.path.exists(patch_path):
        logger.error(f"Patch file not found: {patch_path}")
        return False
    
    logger.info("Applying python-pptx patch for Python 3.12 compatibility...")
    try:
        subprocess.check_call([sys.executable, patch_path])
        logger.info("Successfully applied python-pptx patch")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to apply python-pptx patch: {e}")
        return False

def main():
    """Main function."""
    logger.info("Setting up dependencies...")
    
    # Install required packages
    if not install_packages():
        logger.error("Failed to install all required packages")
        return 1
    
    # Patch python-pptx for Python 3.12 compatibility
    if not patch_pptx():
        logger.error("Failed to patch python-pptx")
        return 1
    
    logger.info("All dependencies set up successfully")
    return 0

if __name__ == "__main__":
    sys.exit(main())
