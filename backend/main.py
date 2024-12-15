from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
app = FastAPI()
print("API RUNNING")
# Database Connection
client = AsyncIOMotorClient(os.getenv("DB_CONNECTION"))
#client = AsyncIOMotorClient("mongodb+srv://netxplore2024:3fpSZdcM9d9VmE3d@clusternet.3vkfl.mongodb.net/?retryWrites=true&w=majority&appName=ClusterNet")
db = client["netXplore"]  # Access the 'netXplore' database
researchers = db["researcher"]  # Access the 'researcher' collection

print
# Pydantic Models
class ResearcherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class ResearcherResponse(BaseModel):
    id: str
    name: str
    email: EmailStr

# Utility Function to Convert MongoDB Document
def document_to_response(doc):
    return {"id": str(doc["_id"]), "name": doc["name"], "email": doc["email"]}

# Create a Researcher
@app.post("/researchers/", response_model=ResearcherResponse)
async def create_researcher(researcher: ResearcherCreate):
    existing = await researchers.find_one({"email": researcher.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_researcher = researcher.dict()
    result = await researchers.insert_one(new_researcher)
    return {"id": str(result.inserted_id), "name": researcher.name, "email": researcher.email}

# Get All Researchers
@app.get("/researchers/", response_model=list[ResearcherResponse])
async def get_all_researchers():
    researcher_list = await researchers.find().to_list(100)
    return [document_to_response(researcher) for researcher in researcher_list]

# Get a Researcher by ID
@app.get("/researchers/{id}", response_model=ResearcherResponse)
async def get_researcher(id: str):
    try:
        researcher = await researchers.find_one({"_id": ObjectId(id)})
        if not researcher:
            raise HTTPException(status_code=404, detail="Researcher not found")
        return document_to_response(researcher)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

# Update a Researcher
@app.put("/researchers/{id}", response_model=ResearcherResponse)
async def update_researcher(id: str, updates: ResearcherCreate):
    try:
        updated_data = {k: v for k, v in updates.dict().items() if v is not None}
        result = await researchers.update_one({"_id": ObjectId(id)}, {"$set": updated_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Researcher not found")
        researcher = await researchers.find_one({"_id": ObjectId(id)})
        return document_to_response(researcher)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

# Delete a Researcher
@app.delete("/researchers/{id}")
async def delete_researcher(id: str):
    try:
        result = await researchers.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Researcher not found")
        return {"message": "Researcher deleted successfully"}
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
