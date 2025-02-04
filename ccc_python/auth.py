from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from db import db

# Get users collection
users_collection = db['users']


def create_user(email: str, password: str) -> dict:
    """Create a new user with hashed password using pbkdf2:sha256 method"""
    existing_user = users_collection.find_one({'email': email})
    if existing_user:
        raise ValueError('Email already exists')

    hashed_password = generate_password_hash(
        password, method='pbkdf2:sha256', salt_length=16)
    user = {
        'email': email,
        'password': hashed_password,
        'created_at': datetime.now()
    }

    result = users_collection.insert_one(user)
    if not result.inserted_id:
        raise Exception('Failed to create user')

    user['_id'] = str(result.inserted_id)
    del user['password']
    return user


def verify_user(email: str, password: str) -> dict:
    """Verify user credentials and return user data"""
    user = users_collection.find_one({'email': email})

    if not user or not check_password_hash(user['password'], password):
        raise ValueError('Invalid email or password')

    user_data = {
        '_id': str(user['_id']),
        'email': user['email'],
        'created_at': user['created_at']
    }
    return user_data
