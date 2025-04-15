#!/usr/bin/env python3
try:
    import pptx
    print('pptx module found at:', pptx.__file__)
except ImportError as e:
    print('Error:', e)
