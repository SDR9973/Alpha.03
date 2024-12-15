from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

# MongoDB connection string
db_connection_string = os.getenv("DB_CONNECTION")

# Create a client and connect to the database
client = AsyncIOMotorClient(db_connection_string)
db = client["research_db"]  # Replace with your database name
researchers = db["researcher"]  # The collection is 'researcher'
