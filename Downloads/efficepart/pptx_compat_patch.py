#!/usr/bin/env python3
"""
This script patches the python-pptx package to work with Python 3.12
by fixing the collections.abc imports.
"""

import os
import sys
import site

# 動的にpptxのパスを検出
def find_pptx_compat_path():
    """Find the path to pptx/compat/__init__.py in the site-packages."""
    for site_path in site.getsitepackages():
        compat_path = os.path.join(site_path, 'pptx', 'compat', '__init__.py')
        if os.path.exists(compat_path):
            return compat_path
    return None

COMPAT_INIT_PATH = find_pptx_compat_path()
PATCHED_CONTENT = '''# encoding: utf-8

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

def main():
    """Patch the python-pptx package."""
    if not COMPAT_INIT_PATH:
        print("Error: Could not find pptx/compat/__init__.py in site-packages.")
        print("Please ensure python-pptx is installed.")
        return 1
    
    if not os.path.exists(COMPAT_INIT_PATH):
        print(f"Error: File not found: {COMPAT_INIT_PATH}")
        return 1
    
    # Create a backup
    backup_path = f"{COMPAT_INIT_PATH}.bak"
    if not os.path.exists(backup_path):
        with open(COMPAT_INIT_PATH, 'r') as f:
            original_content = f.read()
        with open(backup_path, 'w') as f:
            f.write(original_content)
        print(f"Created backup at {backup_path}")
    
    # Write the patched content
    with open(COMPAT_INIT_PATH, 'w') as f:
        f.write(PATCHED_CONTENT)
    
    print(f"Successfully patched {COMPAT_INIT_PATH}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
