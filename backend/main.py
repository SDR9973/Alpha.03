from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from collections import defaultdict

import os

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
