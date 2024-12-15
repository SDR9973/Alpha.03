from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

# MongoDB connection string
db_connection_string = os.getenv("DB_CONNECTION")

# Create a client and connect to the database
client = AsyncIOMotorClient(db_connection_string)
#client = AsyncIOMotorClient("mongodb+srv://netxplore2024:3fpSZdcM9d9VmE3d@clusternet.3vkfl.mongodb.net/?retryWrites=true&w=majority&appName=ClusterNet")
db = client["netXplore"]  # Access the 'netXplore' database
#researchers = db["researcher"]  # Access the 'researcher' collection