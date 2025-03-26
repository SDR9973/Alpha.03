import json
import os
import re
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from uuid import uuid4

import bcrypt
import fastapi
import networkx as nx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import User, Research, UploadedFile, NetworkAnalysis

# Load environment variables
load_dotenv()
db = get_db()
# Configuration Constants
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
UPLOAD_FOLDER = "./uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize FastAPI
app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 Configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# Models for request/response data
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
    avatar: str


# Utility Functions
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Creates a JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes JWT token to extract current user data.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Routes
@app.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    """
    Test protected route that requires authentication.
    """
    return {"message": f"Hello, user {current_user['user_id']}"}


@app.post("/api/auth/google")
async def google_auth(user: OAuthUser):
    """
    Authenticates user using Google OAuth.
    """
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
                "avatar": existing_user.get("avatar", "https://cdn-icons-png.flaticon.com/512/64/64572.png")
            },
        }

    user_id = str(uuid4())
    new_user = {"user_id": user_id, "name": user.name, "email": user.email, "avatar": user.avatar}
    await users_collection.insert_one(new_user)

    token = create_access_token(data={"user_id": user_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "name": user.name, "email": user.email, "avatar": user.avatar},
    }


@app.post("/register")
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user with SQLAlchemy."""
    # Check if email exists
    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Hash password and create user
    hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user.to_dict()


@app.post("/login")
async def login_user(user: UserLogin, db: AsyncSession = Depends(get_db)):
    """Logs in a user with SQLAlchemy."""
    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    db_user = result.scalars().first()

    if not db_user or not bcrypt.checkpw(
            user.password.encode("utf-8"),
            db_user.password.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"user_id": str(db_user.user_id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": db_user.to_dict()
    }


@app.get("/users")
async def get_all_users(db: AsyncSession = Depends(get_db)):
    """Fetches all users with SQLAlchemy."""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [user.to_dict() for user in users]


@app.put("/users/{user_id}")
async def update_user(
        user_id: str,
        user_update: UserUpdate,
        db: AsyncSession = Depends(get_db)
):
    """Updates a user with SQLAlchemy."""
    result = await db.execute(
        select(User).where(User.user_id == uuid.UUID(user_id))
    )
    db_user = result.scalars().first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user attributes
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password"] = bcrypt.hashpw(
            update_data["password"].encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

    for key, value in update_data.items():
        if value is not None:
            setattr(db_user, key, value)

    await db.commit()
    await db.refresh(db_user)

    return db_user.to_dict()


@app.post("/upload-avatar")
async def upload_avatar(
        file: UploadFile = File(...),
        token: str = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_db)
):
    """Uploads a user avatar with SQLAlchemy."""
    current_user = get_current_user(token)
    user_id = current_user["user_id"]

    # Handle file upload logic...
    avatar_url = f"/static/avatars/{file}"

    # Update user in database
    result = await db.execute(
        select(User).where(User.user_id == uuid.UUID(user_id))
    )
    db_user = result.scalars().first()

    if db_user:
        db_user.avatar = avatar_url
        await db.commit()

    return {"avatarUrl": avatar_url}


@app.post("/save-form")
async def save_form(data: dict, db: AsyncSession = Depends(get_db)):
    """Save form data with SQLAlchemy."""
    new_research = Research(
        name=data.get("name"),
        description=data.get("description"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        message_limit=data.get("message_limit")
    )

    db.add(new_research)
    await db.commit()
    await db.refresh(new_research)

    return {"message": "Form saved successfully", "id": str(new_research.id)}


@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    users_collection = db["users"]

    result = await users_collection.delete_one({"user_id": user_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}


# network analysis
@app.post("/upload")
async def upload_file(
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db)
):
    try:
        # Create upload folder if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Generate a unique filename
        file_uuid = uuid4()
        filename = f"{file_uuid}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Save the file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Store file record in database
        new_file = UploadedFile(
            id=file_uuid,
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            file_type=file.content_type or "text/plain"
        )

        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)

        return JSONResponse(
            content={
                "message": "File uploaded successfully!",
                "filename": filename,
                "id": str(new_file.id)
            },
            status_code=200
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.delete("/delete/{filename}")
async def delete_file(
        filename: str,
        db: AsyncSession = Depends(get_db)
):
    try:
        # Find file record in database
        result = await db.execute(
            select(UploadedFile).where(UploadedFile.filename == filename)
        )
        file_record = result.scalars().first()

        # Check if file exists in filesystem
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            if file_record:
                # Delete database record if file doesn't exist
                await db.delete(file_record)
                await db.commit()
            return JSONResponse(
                content={"error": f"File '{filename}' not found."},
                status_code=404
            )

        # Delete file from filesystem
        os.remove(file_path)

        # Delete file record from database if it exists
        if file_record:
            await db.delete(file_record)
            await db.commit()

        return JSONResponse(
            content={"message": f"File '{filename}' deleted successfully!"},
            status_code=200
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/upload")
async def upload_file(
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db)
):
    try:
        # Create upload folder if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Generate a unique filename
        file_uuid = uuid4()
        filename = f"{file_uuid}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Save the file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Store file record in database
        new_file = UploadedFile(
            id=file_uuid,
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            file_type=file.content_type or "text/plain"
        )

        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)

        return JSONResponse(
            content={
                "message": "File uploaded successfully!",
                "filename": filename,
                "id": str(new_file.id)
            },
            status_code=200
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.delete("/delete/{filename}")
async def delete_file(
        filename: str,
        db: AsyncSession = Depends(get_db)
):
    try:
        # Find file record in database
        result = await db.execute(
            select(UploadedFile).where(UploadedFile.filename == filename)
        )
        file_record = result.scalars().first()

        # Check if file exists in filesystem
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            if file_record:
                # Delete database record if file doesn't exist
                await db.delete(file_record)
                await db.commit()
            return JSONResponse(
                content={"error": f"File '{filename}' not found."},
                status_code=404
            )

        # Delete file from filesystem
        os.remove(file_path)

        # Delete file record from database if it exists
        if file_record:
            await db.delete(file_record)
            await db.commit()

        return JSONResponse(
            content={"message": f"File '{filename}' deleted successfully!"},
            status_code=200
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/analyze/network/{filename}")
async def analyze_network(
        filename: str,
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False),
        db: AsyncSession = Depends(get_db)
):
    try:
        # Find file in database
        result = await db.execute(
            select(UploadedFile).where(UploadedFile.filename == filename)
        )
        file_record = result.scalars().first()

        # Check if the file exists in the file system
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return JSONResponse(
                content={"error": f"File '{filename}' not found."},
                status_code=404
            )

        # Store analysis parameters
        analysis_params = {
            "filename": filename,
            "start_date": start_date,
            "start_time": start_time,
            "end_date": end_date,
            "end_time": end_time,
            "limit": limit,
            "limit_type": limit_type,
            "min_length": min_length,
            "max_length": max_length,
            "keywords": keywords,
            "min_messages": min_messages,
            "max_messages": max_messages,
            "active_users": active_users,
            "selected_users": selected_users,
            "username": username,
            "anonymize": anonymize
        }

        # Initialize storage for nodes and edges
        nodes = set()
        user_message_count = defaultdict(int)
        edges_counter = defaultdict(int)
        previous_sender = None
        anonymized_map = {}

        # Parse dates if provided
        start_datetime = None
        end_datetime = None

        if start_date and start_time:
            start_datetime = datetime.strptime(f"{start_date} {start_time}", "%Y-%m-%d %H:%M:%S")
        elif start_date:
            start_datetime = datetime.strptime(f"{start_date} 00:00:00", "%Y-%m-%d %H:%M:%S")

        if end_date and end_time:
            end_datetime = datetime.strptime(f"{end_date} {end_time}", "%Y-%m-%d %H:%M:%S")
        elif end_date:
            end_datetime = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")

        # Function to anonymize names if needed
        def anonymize_name(name, anonymized_map):
            if name.startswith("\u202a+972") or name.startswith("+972"):
                name = f"Phone_{len(anonymized_map) + 1}"
            if name not in anonymized_map:
                anonymized_map[name] = f"User_{len(anonymized_map) + 1}"
            return anonymized_map[name]

        # Read and filter the file contents
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Filter messages by date/time
        filtered_lines = []
        for line in lines:
            if line.startswith("[") and "]" in line:
                date_part = line.split("] ")[0].strip("[]")
                try:
                    current_datetime = datetime.strptime(date_part, "%d.%m.%Y, %H:%M:%S")
                except ValueError:
                    continue

                if ((start_datetime and current_datetime >= start_datetime) or not start_datetime) and \
                        ((end_datetime and current_datetime <= end_datetime) or not end_datetime):
                    filtered_lines.append(line)

        # Apply message limit and type
        if limit and limit_type == "first":
            selected_lines = filtered_lines[:limit]
        elif limit and limit_type == "last":
            selected_lines = filtered_lines[-limit:]
        else:
            selected_lines = filtered_lines

        # Process selected lines
        for line in selected_lines:
            try:
                if "omitted" in line or "הושמט" in line:
                    continue

                if line.startswith("[") and "]" in line and ": " in line:
                    _, message_part = line.split("] ", 1)
                    parts = message_part.split(":", 1)
                    sender = parts[0].strip("~").replace("\u202a", "").strip()
                    message_content = parts[1].strip() if len(parts) > 1 else ""

                    # Apply content filters
                    message_length = len(message_content)
                    if (min_length and message_length < min_length) or \
                            (max_length and message_length > max_length):
                        continue

                    if username and sender.lower() != username.lower():
                        continue

                    if keywords and not any(kw in message_content.lower()
                                            for kw in keywords.split(",")):
                        continue

                    # Count messages per user
                    user_message_count[sender] += 1

                    # Process valid messages
                    if sender:
                        if anonymize:
                            sender = anonymize_name(sender, anonymized_map)

                        nodes.add(sender)
                        if previous_sender and previous_sender != sender:
                            edge = tuple(sorted([previous_sender, sender]))
                            edges_counter[edge] += 1
                        previous_sender = sender
            except Exception as e:
                print(f"Error processing line: {line.strip()} - {e}")
                continue

        # Apply user-based filters
        filtered_users = {
            user: count for user, count in user_message_count.items()
            if (not min_messages or count >= min_messages) and
               (not max_messages or count <= max_messages)
        }

        if active_users:
            sorted_users = sorted(
                filtered_users.items(),
                key=lambda x: x[1],
                reverse=True
            )[:active_users]
            filtered_users = dict(sorted_users)

        if selected_users:
            selected_list = [user.strip().lower() for user in selected_users.split(",")]
            filtered_users = {
                user: count for user, count in filtered_users.items()
                if user.lower() in selected_list
            }

        # Create final node and link lists
        filtered_nodes = set(filtered_users.keys())
        if anonymize:
            filtered_nodes = {anonymize_name(node, anonymized_map) for node in filtered_nodes}

        nodes_list = []
        for node in filtered_nodes:
            node_data = {
                "id": node,
                "messages": user_message_count.get(node, 0)
            }
            nodes_list.append(node_data)

        links_list = []
        for (source, target), weight in edges_counter.items():
            if source in filtered_nodes and target in filtered_nodes:
                links_list.append({
                    "source": source,
                    "target": target,
                    "weight": weight
                })

        # Store analysis results in database
        network_analysis = NetworkAnalysis(
            file_id=file_record.id if file_record else None,
            nodes=nodes_list,
            links=links_list,
            parameters=analysis_params
        )

        db.add(network_analysis)
        await db.commit()
        await db.refresh(network_analysis)

        return JSONResponse(
            content={
                "nodes": nodes_list,
                "links": links_list,
                "analysis_id": str(network_analysis.id)
            },
            status_code=200
        )
    except Exception as e:
        print("Error:", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/upload-chats")
async def upload_chats(
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db)
):
    """
    Process a WhatsApp chat file and store messages in the 
    """
    try:
        # Read file contents
        contents = await file.read()
        text_data = contents.decode("utf-8", errors="replace")
        lines = text_data.splitlines()

        # Create file record
        file_uuid = uuid4()
        filename = f"{file_uuid}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(contents)

        # Create file record in database
        file_record = UploadedFile(
            id=file_uuid,
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            file_type="text/plain"
        )

        db.add(file_record)
        await db.commit()

        # Process the file lines
        pattern = re.compile(r"\[([^\]]+)\]\s*([^:]+):\s*(.+)")
        group_name = None
        processed_messages = []

        for line in lines:
            line = line.strip()
            match = pattern.match(line)
            if match:
                date_time = match.group(1)  # e.g. "7.10.2023, 19:43:25"
                sender = match.group(2).strip()  # e.g. "~🦋"
                message = match.group(3)  # e.g. "איזה יפים אתם❤️ יהיה טוב!!!!"

                # If we haven't set group_name yet, use the first sender
                if group_name is None:
                    group_name = sender

                # Add to processed messages
                processed_messages.append({
                    "date_time": date_time,
                    "sender": sender,
                    "message": message,
                    "group_name": group_name
                })

        # Future implementation: store processed messages in a database table
        # For now, we'll just return the count

        return {
            "status": "success",
            "file_id": str(file_record.id),
            "filename": filename,
            "processed_messages": len(processed_messages),
            "group_name": group_name
        }
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/save-form")
async def save_form(
        data: dict,
        db: AsyncSession = Depends(get_db)
):
    """
    Save research form data in the 
    """
    try:
        # Create new research record
        new_research = Research(
            name=data.get("name"),
            description=data.get("description"),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            message_limit=data.get("message_limit")
        )

        db.add(new_research)
        await db.commit()
        await db.refresh(new_research)

        return {
            "message": "Research saved successfully",
            "id": str(new_research.id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving form: {str(e)}")


@app.get("/analyze/comparison/{filename}")
async def analyze_comparison(
        filename: str,
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False),
        db: AsyncSession = Depends(get_db)
):
    """
    Analyze a file for comparison with other files.
    """
    # Reuse the network analysis logic but add comparison-specific functionality
    result = await analyze_network(
        filename, start_date, start_time, end_date, end_time, limit, limit_type,
        min_length, max_length, keywords, min_messages, max_messages,
        active_users, selected_users, username, anonymize, db
    )

    # Convert result to dict if it's a JSONResponse
    if hasattr(result, 'body'):
        content = json.loads(result.body)
    else:
        content = result

    # Add the filename to the result
    return JSONResponse(content={**content, "filename": filename}, status_code=200)


@app.get("/analyze/compare-networks")
async def analyze_network_comparison(
        original_filename: str = Query(...),
        comparison_filename: str = Query(...),
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False),
        min_weight: int = Query(1),
        node_filter: str = Query(""),
        highlight_common: bool = Query(False),
        metrics: str = Query(None),
        db: AsyncSession = Depends(get_db)
):
    """
    Compare two network analysis files.
    """
    try:
        # Get both network analyses
        original_result = await analyze_network(
            original_filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize, db
        )

        comparison_result = await analyze_network(
            comparison_filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize, db
        )

        # Convert responses to dicts if needed
        if hasattr(original_result, 'body'):
            original_data = json.loads(original_result.body)
        else:
            original_data = original_result

        if hasattr(comparison_result, 'body'):
            comparison_data = json.loads(comparison_result.body)
        else:
            comparison_data = comparison_result

        # Filter networks based on parameters
        def apply_filters(network_data, filter_text, min_weight):
            if not network_data or "nodes" not in network_data or "links" not in network_data:
                return network_data

            # Filter nodes
            filtered_nodes = []
            if filter_text:
                filtered_nodes = [
                    node for node in network_data["nodes"]
                    if filter_text.lower() in str(node["id"]).lower()
                ]
            else:
                filtered_nodes = network_data["nodes"]

            # Get filtered node IDs
            node_ids = {node["id"] for node in filtered_nodes}

            # Filter links by weight and nodes
            filtered_links = [
                link for link in network_data["links"]
                if (link["weight"] >= min_weight and
                    get_node_id(link["source"]) in node_ids and
                    get_node_id(link["target"]) in node_ids)
            ]

            return {"nodes": filtered_nodes, "links": filtered_links}

        # Helper to get node ID
        def get_node_id(node_ref):
            if isinstance(node_ref, dict) and "id" in node_ref:
                return node_ref["id"]
            return node_ref

        # Apply filters
        filtered_original = apply_filters(original_data, node_filter, min_weight)
        filtered_comparison = apply_filters(comparison_data, node_filter, min_weight)

        # Find common nodes if needed
        if highlight_common:
            original_ids = {node["id"] for node in filtered_original["nodes"]}
            comparison_ids = {node["id"] for node in filtered_comparison["nodes"]}
            common_node_ids = original_ids.intersection(comparison_ids)

            # Mark common nodes
            for node in filtered_original["nodes"]:
                node["isCommon"] = node["id"] in common_node_ids

            for node in filtered_comparison["nodes"]:
                node["isCommon"] = node["id"] in common_node_ids

        # Calculate comparison metrics if requested
        comparison_metrics = {}
        if metrics:
            metrics_list = [m.strip() for m in metrics.split(",")]

            # Calculate basic network statistics
            comparison_metrics["node_count"] = {
                "original": len(filtered_original["nodes"]),
                "comparison": len(filtered_comparison["nodes"]),
                "difference": len(filtered_comparison["nodes"]) - len(filtered_original["nodes"]),
                "percent_change": (
                        ((len(filtered_comparison["nodes"]) - len(filtered_original["nodes"])) /
                         max(len(filtered_original["nodes"]), 1)) * 100
                )
            }

            comparison_metrics["link_count"] = {
                "original": len(filtered_original["links"]),
                "comparison": len(filtered_comparison["links"]),
                "difference": len(filtered_comparison["links"]) - len(filtered_original["links"]),
                "percent_change": (
                        ((len(filtered_comparison["links"]) - len(filtered_original["links"])) /
                         max(len(filtered_original["links"]), 1)) * 100
                )
            }

            # Add more metrics as needed

        # Store comparison in database
        # This would be implemented with a new model for comparisons

        # Return the comparison results
        return JSONResponse(content={
            "original": filtered_original,
            "comparison": filtered_comparison,
            "metrics": comparison_metrics
        }, status_code=200)

    except Exception as e:
        print(f"Error in network comparison: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/analyze/communities/{filename}")
async def analyze_communities(
        filename: str,
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False),
        algorithm: str = Query("louvain"),
        db: AsyncSession = Depends(get_db)
):
    """
    Analyze communities in a network.
    """
    try:
        # First get the network data
        network_result = await analyze_network(
            filename, start_date, start_time, end_date, end_time, limit, limit_type,
            min_length, max_length, keywords, min_messages, max_messages,
            active_users, selected_users, username, anonymize, db
        )

        if hasattr(network_result, 'body'):
            network_data = json.loads(network_result.body)
        else:
            network_data = network_result

        if "error" in network_data:
            return JSONResponse(content=network_data, status_code=400)

        # Build a network graph
        import networkx as nx
        import community as community_louvain
        import networkx.algorithms.community as nx_community

        G = nx.Graph()

        for node in network_data["nodes"]:
            G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

        for link in network_data["links"]:
            source = link["source"]
            target = link["target"]
            weight = link.get("weight", 1)

            if isinstance(source, dict) and "id" in source:
                source = source["id"]
            if isinstance(target, dict) and "id" in target:
                target = target["id"]

            G.add_edge(source, target, weight=weight)

        # Detect communities based on algorithm
        communities = {}
        node_communities = {}

        if algorithm == "louvain":
            partition = community_louvain.best_partition(G)
            node_communities = partition

            for node, community_id in partition.items():
                if community_id not in communities:
                    communities[community_id] = []
                communities[community_id].append(node)

        elif algorithm == "girvan_newman":
            communities_iter = nx_community.girvan_newman(G)
            communities_list = list(next(communities_iter))

            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i

        elif algorithm == "greedy_modularity":
            communities_list = list(nx_community.greedy_modularity_communities(G))

            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i
        else:
            return JSONResponse(
                content={
                    "error": f"Unknown algorithm: {algorithm}. Supported: louvain, girvan_newman, greedy_modularity"},
                status_code=400
            )

        # Format communities for response
        communities_list = [
            {
                "id": community_id,
                "size": len(nodes),
                "nodes": nodes,
                "avg_betweenness": sum(network_data["nodes"][i]["betweenness"]
                                       for i, node in enumerate(network_data["nodes"])
                                       if node["id"] in nodes) / max(len(nodes), 1) if nodes else 0,
                "avg_pagerank": sum(network_data["nodes"][i]["pagerank"]
                                    for i, node in enumerate(network_data["nodes"])
                                    if node["id"] in nodes) / max(len(nodes), 1) if nodes else 0,
            }
            for community_id, nodes in communities.items()
        ]

        # Sort communities by size
        communities_list.sort(key=lambda x: x["size"], reverse=True)

        # Add community assignments to nodes
        for i, node in enumerate(network_data["nodes"]):
            node_id = node["id"]
            if node_id in node_communities:
                network_data["nodes"][i]["community"] = node_communities[node_id]

        # Store communities in database
        # For each community, store a record
        for community in communities_list:
            community_record = Community(
                analysis_id=uuid.UUID(network_data.get("analysis_id", str(uuid4()))),
                community_index=community["id"],
                size=community["size"],
                nodes=community["nodes"],
                avg_betweenness=community["avg_betweenness"],
                avg_pagerank=community["avg_pagerank"]
            )
            db.add(community_record)

        await db.commit()

        return JSONResponse(content={
            "nodes": network_data["nodes"],
            "links": network_data["links"],
            "communities": communities_list,
            "node_communities": node_communities,
            "algorithm": algorithm,
            "num_communities": len(communities),
            "modularity": community_louvain.modularity(node_communities, G) if algorithm == "louvain" else None
        }, status_code=200)

    except Exception as e:
        print(f"Error in community detection: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/fetch-wikipedia-data")
async def fetch_wikipedia_data(
        request: fastapi.Request,
        db: AsyncSession = Depends(get_db)
):
    """
    Fetch and analyze Wikipedia discussion pages.
    """
    try:
        # Get the request data
        data = await request.json()
        url = data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="Missing Wikipedia URL")

        # Import necessary libraries
        import requests
        from bs4 import BeautifulSoup
        import logging

        # Set up logging
        logger = logging.getLogger(__name__)

        # Fetch the Wikipedia page
        response = requests.get(url, headers={"User-Agent": "NetXplore-Bot/1.0"})
        response.raise_for_status()
        page_content = response.text
        logger.info("Wikipedia page fetched successfully!")

        # Parse the page content
        soup = BeautifulSoup(page_content, "html.parser")
        discussion_container = soup.find("div", class_="mw-parser-output")

        if not discussion_container:
            logger.error("Failed to fetch discussion container!")
            raise HTTPException(status_code=404, detail="Discussion content not found.")

        # Extract discussion blocks
        discussion_blocks = discussion_container.find_all(["p", "ul", "li", "div"])

        # Process the discussion data
        messages = []
        participants = set()

        for block in discussion_blocks:
            text = block.get_text(strip=True)
            if len(text) < 10:
                continue

            username = None

            # Look for user links
            user_links = block.find_all("a", href=True)
            for link in user_links:
                href = link["href"]
                if "/wiki/משתמש:" in href or "/wiki/User:" in href:
                    username = link.get_text(strip=True)
                    participants.add(username)
                    break

            # Look for bold text as an alternative username marker
            if not username:
                bold_text = block.find("b") or block.find("strong")
                if bold_text:
                    username = bold_text.get_text(strip=True)
                    participants.add(username)

            # Add to messages if we found a username
            if username:
                # Check for indentation
                indentation_level = len(re.match(r"^[:]*", text).group(0))
                messages.append({"user": username, "text": text, "level": indentation_level})

        # Build the network graph
        G = nx.DiGraph()

        # Add nodes (participants)
        for user in participants:
            G.add_node(user, group=1)

        # Add edges (connections between users)
        prev_user = None
        for message in messages:
            current_user = message["user"]

            if prev_user and prev_user != current_user:
                if G.has_edge(prev_user, current_user):
                    G[prev_user][current_user]["weight"] += 1
                else:
                    G.add_edge(prev_user, current_user, weight=1)

            prev_user = current_user

        # Format response
        nodes_list = [{"id": node, "group": 1} for node in G.nodes()]
        links_list = [
            {"source": source, "target": target, "weight": data["weight"]}
            for source, target, data in G.edges(data=True)
        ]

        # Store in database
        file_uuid = uuid4()
        file_name = f"wikipedia_{file_uuid}.json"
        file_path = os.path.join(UPLOAD_FOLDER, file_name)

        # Save as JSON file
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump({
                "url": url,
                "nodes": nodes_list,
                "links": links_list,
                "messages": messages
            }, f, ensure_ascii=False, indent=2)

        # Create file record
        wiki_file = UploadedFile(
            id=file_uuid,
            filename=file_name,
            original_filename=url.split("/")[-1],
            file_path=file_path,
            file_type="application/json"
        )

        db.add(wiki_file)

        # Create network analysis record
        wiki_analysis = NetworkAnalysis(
            file_id=file_uuid,
            nodes=nodes_list,
            links=links_list,
            parameters={"url": url, "source": "wikipedia"}
        )

        db.add(wiki_analysis)
        await db.commit()

        return {
            "nodes": nodes_list,
            "links": links_list,
            "messages": messages,
            "file_id": str(file_uuid),
            "analysis_id": str(wiki_analysis.id)
        }

    except requests.RequestException as e:
        logger.error(f"Error fetching Wikipedia page: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching Wikipedia page: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing Wikipedia data: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing Wikipedia data: {str(e)}")


# API endpoint to get all research projects
@app.get("/research")
async def get_all_research(db: AsyncSession = Depends(get_db)):
    """Get a list of all research projects"""
    try:
        result = await db.execute(select(Research))
        research_projects = result.scalars().all()
        return [project.to_dict() for project in research_projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching research projects: {str(e)}")


# API endpoint to get a specific research project
@app.get("/research/{research_id}")
async def get_research(research_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific research project by ID"""
    try:
        result = await db.execute(
            select(Research).where(Research.id == uuid.UUID(research_id))
        )
        research = result.scalars().first()

        if not research:
            raise HTTPException(status_code=404, detail="Research project not found")

        return research.to_dict()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid research ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching research: {str(e)}")


# API endpoint to get all analyses for a research project
@app.get("/research/{research_id}/analyses")
async def get_research_analyses(research_id: str, db: AsyncSession = Depends(get_db)):
    """Get all network analyses associated with a research project"""
    try:
        result = await db.execute(
            select(NetworkAnalysis).where(NetworkAnalysis.research_id == uuid.UUID(research_id))
        )
        analyses = result.scalars().all()
        return [analysis.to_dict() for analysis in analyses]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid research ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analyses: {str(e)}")


# API endpoint to get a specific analysis
@app.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific network analysis by ID"""
    try:
        result = await db.execute(
            select(NetworkAnalysis).where(NetworkAnalysis.id == uuid.UUID(analysis_id))
        )
        analysis = result.scalars().first()

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        return analysis.to_dict()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analysis: {str(e)}")


# API endpoint to get communities for an analysis
@app.get("/analyses/{analysis_id}/communities")
async def get_analysis_communities(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Get all communities detected for a network analysis"""
    try:
        result = await db.execute(
            select(Community).where(Community.analysis_id == uuid.UUID(analysis_id))
        )
        communities = result.scalars().all()
        return [community.to_dict() for community in communities]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching communities: {str(e)}")


# API endpoint to delete a research project
@app.delete("/research/{research_id}")
async def delete_research(
        research_id: str,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Delete a research project and associated analyses"""
    try:
        # Get the research project
        result = await db.execute(
            select(Research).where(Research.id == uuid.UUID(research_id))
        )
        research = result.scalars().first()

        if not research:
            raise HTTPException(status_code=404, detail="Research project not found")

        # Optional: Check if the user has permission to delete this research
        if research.user_id and str(research.user_id) != current_user['user_id']:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to delete this research"
            )

        # Delete associated analyses
        await db.execute(
            delete(NetworkAnalysis).where(NetworkAnalysis.research_id == uuid.UUID(research_id))
        )

        # Delete the research project
        await db.delete(research)
        await db.commit()

        return {"message": "Research project deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid research ID format")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting research: {str(e)}")


# Main entry point for the application
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
