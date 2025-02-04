from os import path, makedirs

# Flask app configuration


class Config:
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'pdf'}

    # MongoDB Configuration
    MONGODB_URI = 'mongodb://localhost:27017'
    MONGODB_DATABASE = 'pdf_processor'

    # JWT Configuration
    JWT_SECRET_KEY = 'your-super-secret-key-please-change-in-production'

    @staticmethod
    def init_app():
        if not path.exists(Config.UPLOAD_FOLDER):
            makedirs(Config.UPLOAD_FOLDER)

# CORS configuration


class CORSConfig:
    RESOURCES = {
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "send_wildcard": False
        }
    }
