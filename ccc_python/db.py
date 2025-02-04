from pymongo import MongoClient
from config import Config

# Initialize MongoDB client
client = MongoClient(Config.MONGODB_URI)

# Get database instance
db = client[Config.MONGODB_DATABASE]

# Get collections
transactions_collection = db['transactions']
