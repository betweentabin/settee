#!/usr/bin/env python3
"""
This script ensures that the python-pptx module is accessible to all tools
by creating symlinks in the tools directories.
"""

import os
import sys
import site
import shutil
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def find_pptx_module():
    """Find the pptx module in site-packages."""
    try:
        import pptx
        return os.path.dirname(pptx.__file__)
    except ImportError:
        # Try to find it in site-packages
        for site_pkg in site.getsitepackages():
            pptx_path = os.path.join(site_pkg, 'pptx')
            if os.path.exists(pptx_path):
                return pptx_path
    return None

def create_symlinks(pptx_path):
    """Create symlinks to the pptx module in all tool directories."""
    # Get the project root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Find all tool directories
    tools_dir = os.path.join(root_dir, 'tools')
    tool_dirs = [os.path.join(tools_dir, d) for d in os.listdir(tools_dir) 
                if os.path.isdir(os.path.join(tools_dir, d))]
    
    for tool_dir in tool_dirs:
        # Create a symlink in each tool directory
        target_dir = os.path.join(tool_dir, 'pptx')
        if os.path.exists(target_dir):
            logger.info(f"Removing existing directory: {target_dir}")
            shutil.rmtree(target_dir)
        
        # Create the symlink
        logger.info(f"Creating symlink: {pptx_path} -> {target_dir}")
        os.symlink(pptx_path, target_dir)
    
    logger.info("All symlinks created successfully")

def main():
    """Main function."""
    pptx_path = find_pptx_module()
    if not pptx_path:
        logger.error("Could not find pptx module. Please install it with: pip install python-pptx")
        return 1
    
    logger.info(f"Found pptx module at: {pptx_path}")
    create_symlinks(pptx_path)
    return 0

if __name__ == "__main__":
    sys.exit(main())
