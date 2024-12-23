from fastapi import FastAPI, HTTPException, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends
from datetime import datetime, timedelta
from collections import defaultdict
from pydantic import BaseModel, EmailStr, Field
from uuid import uuid4
from database import db
from dotenv import load_dotenv
from jose import jwt, JWTError
import bcrypt
import os

app = FastAPI()
load_dotenv()  

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: str = Field(None)
    email: EmailStr = Field(None)
    password: str = Field(None)

class OAuthUser(BaseModel):
    name: str
    email: str
    photo: str


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello, user {current_user['user_id']}"}

@app.post("/api/auth/google")
async def google_auth(user: OAuthUser):
    users_collection = db["users"]
    existing_user = await users_collection.find_one({"email": user.email})

    if existing_user:
        token = create_access_token(data={"user_id": existing_user["user_id"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": existing_user["user_id"],
                "name": existing_user["name"],
                "email": existing_user["email"],
            },
        }

    user_id = str(uuid4())  
    new_user = {
        "user_id": user_id,
        "name": user.name,
        "email": user.email,
        "photo": user.photo,
    }
    await users_collection.insert_one(new_user)

    token = create_access_token(data={"user_id": user_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "name": user.name, "email": user.email},
    }


@app.post("/register")
async def register_user(user: UserCreate):
    users_collection = db["users"] 

    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user_id = str(uuid4())  

    new_user = {
        "user_id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hashed_password
    }
    result = await users_collection.insert_one(new_user)
    return {"id": user_id, "name": user.name, "email": user.email}


@app.post("/login")
async def login_user(user: UserLogin):
    users_collection = db["users"]  

    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not bcrypt.checkpw(user.password.encode("utf-8"), db_user["password"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(data={"user_id": db_user["user_id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": db_user["user_id"], "name": db_user["name"], "email": db_user["email"]},
    }



@app.get("/users")
async def get_all_users():
    users_collection = db["users"]
    users = await users_collection.find().to_list(100) 
    return [{"id": user["user_id"], "name": user["name"], "email": user["email"]} for user in users]

@app.get("/users/{user_id}")
async def get_user_by_id(user_id: str):
    users_collection = db["users"]
    user = await users_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user["user_id"], "name": user["name"], "email": user["email"]}

@app.put("/users/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate):
    users_collection = db["users"]
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}

    if "password" in update_data:
        update_data["password"] = bcrypt.hashpw(update_data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    result = await users_collection.update_one({"user_id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await users_collection.find_one({"user_id": user_id})
    return {"user_id": updated_user["user_id"], "name": updated_user["name"], "email": updated_user["email"]}



@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    users_collection = db["users"]
    result = await users_collection.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


UPLOAD_FOLDER = "./uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        return JSONResponse(content={"message": "File uploaded successfully!", "filename": file.filename}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.delete("/delete/{filename}")
async def delete_file(filename: str):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return JSONResponse(content={"message": f"File '{filename}' deleted successfully!"}, status_code=200)
        else:
            return JSONResponse(content={"error": f"File '{filename}' not found."}, status_code=404)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/analyze/network/{filename}")
async def analyze_network(
    filename: str,
    start_date: str = Query(None),
    end_date: str = Query(None),
    limit: int = Query(None)  # פרמטר להגבלת מספר ההודעות
):
    try:
        # בדיקה אם הקובץ קיים
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return JSONResponse(content={"error": f"File '{filename}' not found."}, status_code=404)

        # אובייקטים לאחסון צמתים ומונה הקשרים
        nodes = set()
        edges_counter = defaultdict(int)  # מונה הקשרים בין שולחים
        previous_sender = None

        # המרת טווח תאריכים אם הוזנו
        start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
        end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None

        print(f"Analyzing file: {file_path} with range {start} to {end}")

        count = 0  # מונה הודעות
        # קריאת הקובץ
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    # עצירת הלולאה אם הגענו למגבלת הודעות
                    if limit and count >= limit:
                        break

                    # דילוג על הודעות "הושמטה"
                    if "הושמטה" in line or "הושמט" in line:
                        continue

                    # בדיקה שהשורה בפורמט הודעת וואטסאפ
                    if line.startswith("[") and "]" in line and ": " in line:
                        date_part, message_part = line.split("] ", 1)
                        date_str = date_part.strip("[]").split(",")[0]

                        # המרת התאריך לפורמט datetime
                        try:
                            current_date = datetime.strptime(date_str, "%d.%m.%Y")
                        except ValueError:
                            print(f"Invalid date format in line: {line.strip()}") 
                            continue

                        # סינון לפי טווח תאריכים
                        if start and end:
                            if not (start <= current_date <= end):
                                continue  # מחוץ לטווח

                        # חילוץ השם של השולח
                        sender = message_part.split(":")[0].strip("~").replace(" ", "").strip()

                        if sender:
                            nodes.add(sender)  # הוספת שולח לצמתים

                            # חישוב כמות הקשרים בין שולחים
                            if previous_sender and previous_sender != sender:
                                edge = tuple(sorted([previous_sender, sender]))  # שמירת זוג מסודר
                                edges_counter[edge] += 1
                            previous_sender = sender

                            count += 1  # ספירת הודעה שנכללה

                except Exception as e:
                    print(f"Error processing line: {line.strip()} - {e}")
                    continue

        # יצירת רשימת הצמתים והקשרים עם משקלים
        nodes_list = [{"id": node} for node in nodes]
        links_list = [
            {"source": edge[0], "target": edge[1], "weight": weight}
            for edge, weight in edges_counter.items()
        ]

        print("Final nodes:", nodes_list)
        print("Final links with weights:", links_list)

        # החזרת JSON עם צמתים וקשרים
        return JSONResponse(content={"nodes": nodes_list, "links": links_list}, status_code=200)

    except Exception as e:
        print("Error:", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)
