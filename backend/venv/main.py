# Run: uvicorn main:app --reload --port 8000

# from fastapi import FastAPI
# app = FastAPI()

# @app.get("/")
# async def root():
#     return {"message": "Hello, FastAPI222!"}

# from fastapi import FastAPI, File, UploadFile
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# import os

# app = FastAPI()

# # הגדרת CORS כדי שה-Frontend יוכל להתחבר ל-Backend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],  # כתובת ה-Frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # הגדרת תיקייה זמנית לשמירת הקבצים
# UPLOAD_FOLDER = "./uploads/"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# @app.post("/upload")
# async def upload_file(file: UploadFile = File(...)):
#     try:
#         file_path = os.path.join(UPLOAD_FOLDER, file.filename)
#         with open(file_path, "wb") as f:
#             f.write(await file.read())
#         return JSONResponse(content={"message": "File uploaded successfully!", "filename": file.filename}, status_code=200)
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)


# # מחיקת קובץ
# @app.delete("/delete/{filename}")
# async def delete_file(filename: str):
#     try:
#         file_path = os.path.join(UPLOAD_FOLDER, filename)
#         if os.path.exists(file_path):
#             os.remove(file_path)
#             return JSONResponse(content={"message": f"File '{filename}' deleted successfully!"}, status_code=200)
#         else:
#             return JSONResponse(content={"error": f"File '{filename}' not found."}, status_code=404)
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

app = FastAPI()

# הגדרת CORS כדי שה-Frontend יוכל להתחבר ל-Backend
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

# @app.get("/analyze/{filename}")
# async def analyze_file(filename: str):
#     try:
#         file_path = os.path.join(UPLOAD_FOLDER, filename)
#         if not os.path.exists(file_path):
#             return JSONResponse(content={"error": f"File '{filename}' not found."}, status_code=404)

#         # ניתוח בסיסי: ספירת מילים
#         with open(file_path, "r", encoding="utf-8") as f:
#             content = f.read()
#             word_count = {}
#             for word in content.split():
#                 word = word.strip(".,!?").lower()
#                 word_count[word] = word_count.get(word, 0) + 1

#         return JSONResponse(content={"analysis": word_count}, status_code=200)
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)
@app.get("/analyze/network/{filename}")
async def analyze_network(filename: str):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return JSONResponse(content={"error": f"File '{filename}' not found."}, status_code=404)

        # דוגמה של בניית גרף רשת פשוטה
        nodes = []
        edges = []
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.readlines()
            people = set()  # רשימת אנשים מהשיחה
            for line in content:
                if ":" in line:  # חיפוש הודעות בפורמט "שם: הודעה"
                    name = line.split(":")[0].strip()
                    people.add(name)

            # יצירת צמתים
            nodes = [{"id": person} for person in people]

            # דוגמת יצירת קשרים רנדומליים בין הצמתים
            people_list = list(people)
            for i in range(len(people_list) - 1):
                edges.append({"source": people_list[i], "target": people_list[i + 1]})

        return JSONResponse(content={"nodes": nodes, "links": edges}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
