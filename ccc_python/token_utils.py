import jwt
from datetime import datetime, timedelta
from config import Config


def generate_token(user_data: dict) -> str:
    """Generate a JWT token for the user"""
    payload = {
        'user': {
            '_id': user_data['_id'],
            'email': user_data['email']
        },
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY,
                             algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token')
