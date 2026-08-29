import sys
import os

# Add the backend directory to Python path to resolve 'app' imports correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import app
