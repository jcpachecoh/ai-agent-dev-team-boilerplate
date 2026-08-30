"""
Legacy entry point — delegates to the ai_dev_team package.
Run the full workflow with:
    python -m ai_dev_team
or:
    python ai-dev-team/main.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from ai_dev_team.main import main

if __name__ == "__main__":
    main()
