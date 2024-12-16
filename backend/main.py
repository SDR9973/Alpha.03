from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
from database import db
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

# Load environment variables
load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)
print("API RUNNING")
researchers = db["researcher"]  # Access the 'researcher' collection


# Pydantic Models
class ResearcherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class ResearcherResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    password: str

class ResearcherSignIn(BaseModel):
    password: str
    email: EmailStr


# Utility Function to Convert MongoDB Document
def document_to_response(doc):
    return {"id": str(doc["_id"]), "name": doc["name"], "email": doc["email"], "password":doc["password"] }

@app.post("/researchers/signin", response_model=ResearcherResponse)
async def signin(data:ResearcherSignIn ):
    user = await researchers.find_one({"email": data.email, "password":data.password})
    if not user:  
        return {"invalid email or password"}
    else:
        return document_to_response(user)
    
# Create a Researcher
@app.post("/researchers", response_model=ResearcherResponse)
async def create_researcher(researcher: ResearcherCreate):
    existing = await researchers.find_one({"email": researcher.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_researcher = researcher.model_dump()
    result = await researchers.insert_one(new_researcher)
    return {"id": str(result.inserted_id), "name": researcher.name, "email": researcher.email, "password":researcher.password }

# Get All Researchers
@app.get("/researchers", response_model=list[ResearcherResponse])
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
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)