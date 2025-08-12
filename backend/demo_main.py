from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
import uuid
import time
from typing import Optional
import shutil

app = FastAPI(title="Stormy Video API Demo", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage for tracking video generation status
video_tasks = {}

class VideoTask:
    def __init__(self, task_id: str, script: str, video_type: str, logo_path: Optional[str] = None):
        self.task_id = task_id
        self.script = script
        self.video_type = video_type
        self.logo_path = logo_path
        self.status = "processing"
        self.result_url = None
        self.error = None
        self.created_at = time.time()

@app.post("/create-video")
async def create_video(
    script: str = Form(...),
    video_type: str = Form(..., description="Either 'durov' or 'tucker'"),
    logo: Optional[UploadFile] = File(None)
):
    """
    Создает видео с липсинком (демо версия)
    """
    if video_type not in ["durov", "tucker"]:
        raise HTTPException(status_code=400, detail="video_type must be either 'durov' or 'tucker'")
    
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Save logo if provided
    logo_path = None
    if logo:
        logo_path = f"/tmp/logo_{task_id}.{logo.filename.split('.')[-1]}"
        with open(logo_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
    
    # Create video task
    video_task = VideoTask(task_id, script, video_type, logo_path)
    video_tasks[task_id] = video_task
    
    # Start video generation in background (демо - имитация обработки)
    asyncio.create_task(demo_generate_video(video_task))
    
    return {
        "task_id": task_id,
        "status": "processing",
        "message": "Video generation started (demo mode)"
    }

async def demo_generate_video(video_task: VideoTask):
    """
    Демо версия генерации видео - имитирует обработку
    """
    try:
        # Проверяем существование видео файла
        video_file_path = f"videos/{video_task.video_type}.mov"
        if not os.path.exists(video_file_path):
            video_task.status = "error"
            video_task.error = f"Video file {video_file_path} not found"
            return
        
        # Имитируем обработку (5-15 секунд)
        processing_time = 5 + (hash(video_task.script) % 10)
        await asyncio.sleep(processing_time)
        
        # Генерируем демо URL
        video_task.status = "completed"
        video_task.result_url = f"https://demo.sync.so/video/{video_task.task_id}.mp4"
        
        print(f"Demo video completed for task {video_task.task_id}")
        print(f"Script: {video_task.script}")
        print(f"Video type: {video_task.video_type}")
        print(f"Logo: {'Yes' if video_task.logo_path else 'No'}")
        
    except Exception as e:
        video_task.status = "error"
        video_task.error = str(e)
    finally:
        # Cleanup temporary files
        if video_task.logo_path and os.path.exists(video_task.logo_path):
            os.remove(video_task.logo_path)

@app.get("/video-status/{task_id}")
async def get_video_status(task_id: str):
    """
    Long polling endpoint для проверки статуса видео
    """
    if task_id not in video_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    video_task = video_tasks[task_id]
    
    # Long polling - ждем изменения статуса
    max_wait_time = 30  # секунд
    wait_time = 0
    check_interval = 1  # секунда
    
    while video_task.status == "processing" and wait_time < max_wait_time:
        await asyncio.sleep(check_interval)
        wait_time += check_interval
    
    response_data = {
        "task_id": task_id,
        "status": video_task.status
    }
    
    if video_task.status == "completed":
        response_data["result_url"] = video_task.result_url
        # Удаляем задачу после завершения
        del video_tasks[task_id]
    elif video_task.status == "error":
        response_data["error"] = video_task.error
        # Удаляем задачу после ошибки
        del video_tasks[task_id]
    
    return response_data

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy", 
        "active_tasks": len(video_tasks),
        "mode": "demo"
    }

@app.get("/tasks")
async def list_tasks():
    """
    Список активных задач (для отладки)
    """
    tasks = []
    for task_id, task in video_tasks.items():
        tasks.append({
            "task_id": task_id,
            "script": task.script,
            "video_type": task.video_type,
            "status": task.status,
            "created_at": task.created_at
        })
    return {"tasks": tasks}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
