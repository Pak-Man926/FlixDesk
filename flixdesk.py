#!/usr/bin/env python3
"""
FlixDesk - Launcher
"""

import sys
import os

# Add local directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flixdesk.main import main

if __name__ == "__main__":
    main()
