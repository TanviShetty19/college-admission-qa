import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'college-qa-secret-key-2024')
    DEBUG = os.getenv('DEBUG', True)
    KNOWLEDGE_BASE_PATH = 'data/knowledge_base.json'
    PROGRAMS_DATA_PATH = 'data/programs.json'
    ADMISSION_RULES_PATH = 'data/admission_rules.json'