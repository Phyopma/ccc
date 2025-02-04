from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import Config
import sys
import time


def get_mongodb_client():
    """Initialize MongoDB client with connection pooling and retry logic"""
    max_retries = 3
    retry_delay = 2

    for attempt in range(max_retries):
        try:
            # Initialize MongoDB client with connection pooling settings
            client = MongoClient(
                Config.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                maxPoolSize=50,
                minPoolSize=10,
                maxIdleTimeMS=30000,
                waitQueueTimeoutMS=2000
            )
            # Test the connection
            client.server_info()
            print("Successfully connected to MongoDB", flush=True)
            return client
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            if attempt < max_retries - 1:
                print(f"""MongoDB connection attempt {
                      attempt + 1} failed: {str(e)}. Retrying...""", flush=True)
                time.sleep(retry_delay)
            else:
                print(f"Failed to connect to MongoDB after {max_retries} attempts: {str(e)}",
                      file=sys.stderr, flush=True)
                sys.exit(1)
        except Exception as e:
            print(f"Unexpected error connecting to MongoDB: {str(e)}",
                  file=sys.stderr, flush=True)
            sys.exit(1)


# Initialize MongoDB client and collections
client = get_mongodb_client()
db = client[Config.MONGODB_DATABASE]
transactions_collection = db['transactions']
