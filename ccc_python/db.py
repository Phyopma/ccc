from pymongo import MongoClient
from config import Config
import sys

try:
    # Initialize MongoDB client with a timeout
    client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Test the connection
    client.server_info()
    # Get database instance
    db = client[Config.MONGODB_DATABASE]
    # Get collections
    transactions_collection = db['transactions']
    print("Successfully connected to MongoDB", flush=True)
except Exception as e:
    print(f"""Error connecting to MongoDB: {
          str(e)}""", file=sys.stderr, flush=True)
    sys.exit(1)
