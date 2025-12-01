import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import MeetingData

app = FastAPI(title="Lab Meeting API")

# 配置 CORS (为了本地开发方便，生产环境靠 Nginx)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据文件路径：当前文件父级(app)的父级(backend)/data/data.json
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "data.json"

# 确保 data 目录存在
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

# 如果文件不存在，初始化一个空的
if not DATA_FILE.exists():
    DATA_FILE.write_text(json.dumps({"members": [], "meetingDate": None}), encoding="utf-8")

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/data", response_model=MeetingData)
async def get_data():
    try:
        content = DATA_FILE.read_text(encoding="utf-8")
        return json.loads(content)
    except Exception as e:
        print(f"Error reading data: {e}")
        return {"members": [], "meetingDate": None}

@app.post("/api/save-data")
async def save_data(payload: MeetingData):
    try:
        # 使用 ensure_ascii=False 保证中文不乱码
        json_str = json.dumps(payload.model_dump(), ensure_ascii=False, indent=2)
        DATA_FILE.write_text(json_str, encoding="utf-8")
        return {"success": True, "message": "Data saved"}
    except Exception as e:
        print(f"Error saving data: {e}")
        # 抛出 500 错误，让前端能捕获到
        raise HTTPException(status_code=500, detail=str(e))