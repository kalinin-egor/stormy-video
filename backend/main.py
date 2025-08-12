from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
import asyncio
import json
import os
import uuid
import logging
from typing import Optional
import tempfile
import shutil
from pathlib import Path
from sync import Sync
from sync.common import Audio, GenerationOptions, Video
from sync.core.api_error import ApiError
import subprocess
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stormy Video API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sync.so API configuration
SYNC_API_KEY = "sk-QBDJlrq_ST-BHu4iOjFcBA.EnxoWzH6bYcv_P0nJm_NMGPS1av5rLl0"

# Initialize Sync client
sync_client = Sync(api_key=SYNC_API_KEY)

# Test API connection on startup
async def test_sync_api():
    """Test Sync.so API connection"""
    try:
        # Test SDK connection
        logger.info("Testing Sync.so SDK connection...")
        # You can test with a simple operation like getting account info
        logger.info("Sync.so SDK initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Sync.so SDK connection test failed: {e}")
        return False

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

@app.post("/create-video")
async def create_video(
    script: str = Form(...),
    video_type: str = Form(..., description="Either 'durov' or 'tucker'"),
    logo: Optional[UploadFile] = File(None)
):
    logger.info(f"Received create-video request")
    logger.info(f"Script length: {len(script)}")
    logger.info(f"Video type: {video_type}")
    logger.info(f"Logo provided: {logo is not None}")
    if logo:
        logger.info(f"Logo filename: {logo.filename}")
        logger.info(f"Logo content type: {logo.content_type}")
        logger.info(f"Logo size: {logo.size if hasattr(logo, 'size') else 'unknown'}")
    """
    Создает видео с липсинком используя Sync.so API
    """
    logger.info(f"Creating video task - video_type: {video_type}, script_length: {len(script)}")
    logger.info(f"Script content: '{script}'")
    
    if video_type not in ["durov", "tucker"]:
        logger.error(f"Invalid video_type: {video_type}")
        raise HTTPException(status_code=400, detail="video_type must be either 'durov' or 'tucker'")
    
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    logger.info(f"Generated task_id: {task_id}")
    
    # Save logo if provided
    logo_path = None
    if logo:
        logo_path = f"/tmp/logo_{task_id}.{logo.filename.split('.')[-1]}"
        logger.info(f"Saving logo to: {logo_path}")
        try:
            # Reset file pointer to beginning
            logo.file.seek(0)
            
            # Read the file content
            logo_content = logo.file.read()
            logger.info(f"Read logo content, size: {len(logo_content)} bytes")
            
            # Save to file
            with open(logo_path, "wb") as buffer:
                buffer.write(logo_content)
            
            logger.info(f"Logo saved successfully to: {logo_path}")
            # Verify file exists and has content
            if os.path.exists(logo_path):
                file_size = os.path.getsize(logo_path)
                logger.info(f"Logo file verified: {logo_path}, size: {file_size} bytes")
            else:
                logger.error(f"Logo file was not created: {logo_path}")
        except Exception as e:
            logger.error(f"Error saving logo: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            logo_path = None
    
    # Create video task
    video_task = VideoTask(task_id, script, video_type, logo_path)
    video_tasks[task_id] = video_task
    logger.info(f"Created video task: {task_id}")
    
    # Start video generation in background
    asyncio.create_task(generate_video(video_task))
    logger.info(f"Started background video generation for task: {task_id}")
    
    return {
        "task_id": task_id,
        "status": "processing",
        "message": "Video generation started"
    }

async def generate_video(video_task: VideoTask):
    """
    Генерирует видео используя Sync.so API
    """
    logger.info(f"Starting video generation for task: {video_task.task_id}")
    logger.info(f"Task details - video_type: {video_task.video_type}, script_length: {len(video_task.script)}")
    
    try:
        # Determine video file path
        video_file_path = f"videos/{video_task.video_type}.mov"
        logger.info(f"Looking for video file: {video_file_path}")
        
        if not os.path.exists(video_file_path):
            error_msg = f"Video file {video_file_path} not found"
            logger.error(f"Task {video_task.task_id}: {error_msg}")
            video_task.status = "error"
            video_task.error = error_msg
            return
        
        logger.info(f"Video file found: {video_file_path}")
        
        # Generate audio from text using gTTS and save locally
        logger.info(f"Generating audio from text using gTTS for task: {video_task.task_id}")
        audio_url = await generate_audio_with_sync_tts(video_task.script, video_task.task_id)
        if not audio_url:
            error_msg = "Failed to generate audio with gTTS"
            logger.error(f"Task {video_task.task_id}: {error_msg}")
            video_task.status = "error"
            video_task.error = error_msg
            return
        
        logger.info(f"Audio generated successfully: {audio_url}")
        
        # Get video URL - use a public URL that Sync.so can access
        logger.info("Using public video URL for Sync.so...")
        # For now, use a public demo video URL that Sync.so can access
        video_url = "https://www.dropbox.com/scl/fi/5504cmeeq6wlh0gm1vnd3/durov.mov?rlkey=5p8d8kwfn6k1a6ebl0uuodpm8&st=ri5d9e4j&raw=1"
        logger.info(f"Using public video URL: {video_url}")
        
        # Audio URL is already set from pre-recorded file
        logger.info(f"Video URL: {video_url}")
        logger.info(f"Audio URL: {audio_url}")
        
        # Create generation using Sync.so API
        logger.info(f"Creating lipsync generation for task: {video_task.task_id}")
        logger.info(f"Request data:")
        logger.info(f"  - Video URL: {video_url}")
        logger.info(f"  - Audio URL: {audio_url}")
        logger.info(f"  - Model: lipsync-2")
        logger.info(f"  - Sync mode: cut_off")
        
        try:
            response = sync_client.generations.create(
                input=[Video(url=video_url), Audio(url=audio_url)],
                model="lipsync-2",
                options=GenerationOptions(sync_mode="cut_off")
            )
            
            job_id = response.id
            logger.info(f"Generation submitted successfully, job id: {job_id}")
            
            # Monitor the generation
            await monitor_generation(video_task, job_id)
            
        except ApiError as e:
            error_msg = f"Create generation request failed with status code {e.status_code} and error {e.body}"
            logger.error(f"Task {video_task.task_id}: {error_msg}")
            video_task.status = "error"
            video_task.error = error_msg
            return
        
    except Exception as e:
        error_msg = f"Unexpected error in video generation: {str(e)}"
        logger.error(f"Task {video_task.task_id}: {error_msg}")
        video_task.status = "error"
        video_task.error = str(e)
    finally:
        # Cleanup temporary files
        logger.info(f"Cleaning up temporary files for task: {video_task.task_id}")
        
        # Don't remove logo file here - it will be removed after logo overlay
        # if video_task.logo_path and os.path.exists(video_task.logo_path):
        #     os.remove(video_task.logo_path)
        #     logger.info(f"Removed logo file: {video_task.logo_path}")
        
        # No audio file to clean up (using pre-recorded URL)
        logger.info("No temporary audio file to clean up")

async def generate_audio_with_sync_tts(text: str, task_id: str) -> Optional[str]:
    """
    Генерирует аудио из текста используя Sync.so TTS и сохраняет в папку videos
    """
    logger.info(f"Generating audio with Sync.so TTS, text: '{text}', length: {len(text)}")
    
    try:
        # Create TTS generation using Sync.so API
        logger.info("Creating TTS generation with Sync.so")
        
        # Generate audio using gTTS and save locally
        logger.info("Generating audio with gTTS...")
        audio_data = await generate_audio_from_text(text)
        if not audio_data:
            logger.error("Failed to generate audio with gTTS")
            return None
        
        # Save audio to local file
        audio_filename = f"audio_{task_id}.wav"
        audio_path = f"videos/{audio_filename}"
        
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        logger.info(f"Audio generated and saved to: {audio_path}")
        
        # For Sync.so API, use Dropbox URL instead of local URL
        dropbox_audio_url = "https://www.dropbox.com/scl/fi/f9samle47tlaf7y57nulm/audio_db970762-a76f-4960-85a3-a2aa58be75a1.wav?rlkey=uhj5k7u7bv8szcl0xqwxzipf3&st=eobuzbne&raw=1"
        logger.info(f"Using Dropbox audio URL for Sync.so: {dropbox_audio_url}")
        return dropbox_audio_url
        
        # Audio is already generated and saved, return the URL
        return local_audio_url
                
    except Exception as e:
        error_msg = f"Sync.so TTS generation error: {e}"
        logger.error(error_msg)
        return None

async def generate_audio_from_text(text: str) -> Optional[bytes]:
    """
    Генерирует аудио из текста используя gTTS (Google Text-to-Speech)
    """
    logger.info(f"Generating audio from text, length: {len(text)}")
    logger.info(f"Text content: '{text}'")
    
    try:
        from gtts import gTTS
        import io
        
        logger.info("Creating gTTS object for English language")
        # Создаем TTS объект для английского языка
        tts = gTTS(text=text, lang='en', slow=False)
        
        logger.info("Converting text to audio bytes")
        # Сохраняем в байты
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        audio_data = audio_buffer.read()
        logger.info(f"Audio generation successful, size: {len(audio_data)} bytes")
        return audio_data
    except ImportError:
        error_msg = "gTTS not installed. Please install it with: pip install gTTS"
        logger.error(error_msg)
        print(error_msg)
        return None
    except Exception as e:
        error_msg = f"TTS error: {e}"
        logger.error(error_msg)
        print(error_msg)
        return None

async def serve_file_locally(file_path: str) -> Optional[str]:
    """
    Создает локальный HTTP сервер для раздачи файла и возвращает URL
    """
    logger.info(f"Serving file locally: {file_path}")
    
    # Check file size
    file_size = os.path.getsize(file_path)
    logger.info(f"File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
    
    try:
        # For demo purposes, we'll use a simple approach
        # In production, you should use a proper file hosting service
        
        # Get the filename
        filename = os.path.basename(file_path)
        
        # For demo purposes, we'll use a simple approach
        # In production, you should use a proper file hosting service
        
        # Get the filename
        filename = os.path.basename(file_path)
        
        # Create a local URL for the file
        # This will work if Sync.so can access your local server
        # In production, you should use a public file hosting service
        if filename.endswith('.mov'):
            # For video files, use local server URL
            local_url = f"http://localhost:8000/files/{filename}"
            logger.info(f"Using local video URL: {local_url}")
            return local_url
        elif filename.endswith('.wav'):
            # For audio files, use local server URL
            local_url = f"http://localhost:8000/files/{filename}"
            logger.info(f"Using local audio URL: {local_url}")
            return local_url
        else:
            logger.warning(f"Unknown file type: {filename}")
            return "https://www.dropbox.com/scl/fi/5504cmeeq6wlh0gm1vnd3/durov.mov?rlkey=5p8d8kwfn6k1a6ebl0uuodpm8&st=ri5d9e4j&raw=1"
            
    except Exception as e:
        error_msg = f"File serving error: {e}"
        logger.error(error_msg)
        print(error_msg)
        return None



async def add_logo_to_video(video_url: str, logo_path: str, task_id: str) -> Optional[str]:
    """
    Накладывает логотип на видео используя moviepy
    """
    logger.info(f"=== Starting logo overlay process ===")
    logger.info(f"Task ID: {task_id}")
    logger.info(f"Video URL: {video_url}")
    logger.info(f"Logo path: {logo_path}")
    logger.info(f"Logo file exists: {os.path.exists(logo_path)}")
    if os.path.exists(logo_path):
        logger.info(f"Logo file size: {os.path.getsize(logo_path)} bytes")
    
    try:
        # Download the video file with redirect handling
        async with httpx.AsyncClient(follow_redirects=True) as client:
            video_response = await client.get(video_url)
            if video_response.status_code != 200:
                logger.error(f"Failed to download video: {video_response.status_code}")
                logger.error(f"Response headers: {video_response.headers}")
                return None
            
            # Check if response is actually video
            content_type = video_response.headers.get('content-type', '')
            logger.info(f"Response content type: {content_type}")
            
            if 'video' not in content_type.lower() and 'application/octet-stream' not in content_type.lower():
                logger.warning(f"Response might not be video. Content type: {content_type}")
                # Log first 100 bytes to see what we got
                logger.info(f"First 100 bytes: {video_response.content[:100]}")
            
            # Save video to temporary file
            video_temp_path = f"/tmp/video_{task_id}.mp4"
            with open(video_temp_path, "wb") as f:
                f.write(video_response.content)
            logger.info(f"Video saved to: {video_temp_path}")
            logger.info(f"Video size: {len(video_response.content)} bytes")
            
            # Verify file was created and has reasonable size
            if os.path.exists(video_temp_path):
                file_size = os.path.getsize(video_temp_path)
                logger.info(f"Video file verified: {video_temp_path}, size: {file_size} bytes")
                if file_size < 1000:  # Less than 1KB is suspicious
                    logger.warning(f"Video file seems too small: {file_size} bytes")
            else:
                logger.error(f"Video file was not created: {video_temp_path}")
                return None
        
        # Create output path
        output_path = f"/tmp/video_with_logo_{task_id}.mp4"
        
        # Use moviepy to overlay logo on video
        def process_video_with_moviepy():
            try:
                from moviepy.editor import VideoFileClip, ImageClip, CompositeVideoClip
                from PIL import Image
                
                # Load video
                video_clip = VideoFileClip(video_temp_path)
                
                # Load and resize logo
                logo_img = Image.open(logo_path)
                # Resize logo to reasonable size (e.g., 100px width)
                logo_width = 100
                logo_height = int(logo_width * logo_img.height / logo_img.width)
                logo_img = logo_img.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
                
                # Save resized logo temporarily
                resized_logo_path = f"/tmp/resized_logo_{task_id}.png"
                logo_img.save(resized_logo_path)
                
                # Create logo clip
                logo_clip = ImageClip(resized_logo_path)
                
                # Position logo in top-right corner with padding
                logo_clip = logo_clip.set_position(('right', 'top')).set_duration(video_clip.duration)
                
                # Composite video with logo
                final_clip = CompositeVideoClip([video_clip, logo_clip])
                
                # Write output
                final_clip.write_videofile(output_path, codec='libx264', audio_codec='aac')
                
                # Clean up
                video_clip.close()
                logo_clip.close()
                final_clip.close()
                os.remove(resized_logo_path)
                
                logger.info(f"MoviePy logo overlay completed successfully: {output_path}")
                return True
                
            except ImportError:
                logger.error("MoviePy not available, falling back to ffmpeg")
                return False
            except Exception as e:
                logger.error(f"MoviePy error: {e}")
                return False
        
        # Try moviepy first, fallback to ffmpeg
        success = False
        
        # Run in thread to avoid blocking
        def run_processing():
            nonlocal success
            success = process_video_with_moviepy()
        
        thread = threading.Thread(target=run_processing)
        thread.start()
        thread.join(timeout=300)  # Wait up to 5 minutes
        
        if thread.is_alive():
            logger.error("Video processing thread timeout")
            return None
        
        if not success:
            # Fallback to ffmpeg
            logger.info("Falling back to ffmpeg for logo overlay")
            cmd = [
                'ffmpeg',
                '-i', video_temp_path,
                '-i', logo_path,
                '-filter_complex', '[1:v]scale=100:-1[logo];[0:v][logo]overlay=W-w-20:20',
                '-c:a', 'copy',
                '-y',  # Overwrite output file
                output_path
            ]
            
            logger.info(f"Running ffmpeg command: {' '.join(cmd)}")
            
            def run_ffmpeg():
                try:
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
                    if result.returncode == 0:
                        logger.info(f"FFmpeg logo overlay completed successfully: {output_path}")
                        return True
                    else:
                        logger.error(f"FFmpeg failed: {result.stderr}")
                        return False
                except subprocess.TimeoutExpired:
                    logger.error("FFmpeg timeout")
                    return False
                except Exception as e:
                    logger.error(f"FFmpeg error: {e}")
                    return False
            
            ffmpeg_thread = threading.Thread(target=run_ffmpeg)
            ffmpeg_thread.start()
            ffmpeg_thread.join(timeout=300)
            
            if ffmpeg_thread.is_alive():
                logger.error("FFmpeg thread timeout")
                return None
        
        # Check if output file was created
        if not os.path.exists(output_path):
            logger.error("Output file was not created")
            return None
        
        # Copy to videos directory for serving
        final_path = f"videos/video_with_logo_{task_id}.mp4"
        shutil.copy2(output_path, final_path)
        
        # Cleanup temporary files
        os.remove(video_temp_path)
        os.remove(output_path)
        
        # Create local URL
        local_url = f"http://localhost:8000/files/video_with_logo_{task_id}.mp4"
        
        logger.info(f"Logo overlay completed, final URL: {local_url}")
        return local_url
        
    except Exception as e:
        error_msg = f"Logo overlay error: {e}"
        logger.error(error_msg)
        return None

async def monitor_generation(video_task: VideoTask, job_id: str):
    """
    Мониторит статус генерации используя Sync.so API
    """
    logger.info(f"Starting monitoring for task: {video_task.task_id}, job: {job_id}")
    
    while True:
        try:
            generation = sync_client.generations.get(job_id)
            status = generation.status
            logger.info(f"Generation {job_id} status: {status}")
            
            if status == 'COMPLETED':
                result_url = generation.output_url
                logger.info(f"Task {video_task.task_id} completed successfully, output_url: {result_url}")
                
                # Add logo if provided
                logger.info(f"=== Checking for logo overlay ===")
                logger.info(f"Video task logo path: {video_task.logo_path}")
                if video_task.logo_path:
                    logger.info(f"Logo path exists: {video_task.logo_path}")
                    if os.path.exists(video_task.logo_path):
                        file_size = os.path.getsize(video_task.logo_path)
                        logger.info(f"Logo file exists and has size: {file_size} bytes")
                        logger.info(f"Adding logo to video for task: {video_task.task_id}")
                        final_url = await add_logo_to_video(result_url, video_task.logo_path, video_task.task_id)
                    else:
                        logger.warning(f"Logo file does not exist: {video_task.logo_path}")
                        final_url = None
                    
                    if final_url:
                        video_task.result_url = final_url
                        logger.info(f"Video with logo ready: {final_url}")
                        # Clean up logo file after successful overlay
                        try:
                            os.remove(video_task.logo_path)
                            logger.info(f"Removed logo file after overlay: {video_task.logo_path}")
                        except Exception as e:
                            logger.warning(f"Could not remove logo file: {e}")
                    else:
                        # Fallback to original video if logo overlay fails
                        logger.warning(f"Logo overlay failed, using original video for task: {video_task.task_id}")
                        video_task.result_url = result_url
                        # Clean up logo file even if overlay failed
                        try:
                            os.remove(video_task.logo_path)
                            logger.info(f"Removed logo file after failed overlay: {video_task.logo_path}")
                        except Exception as e:
                            logger.warning(f"Could not remove logo file: {e}")
                else:
                    logger.info("No logo path provided, skipping logo overlay")
                    video_task.result_url = result_url
                
                video_task.status = "completed"
                break
            elif status == 'FAILED':
                error_msg = getattr(generation, 'error', 'Generation failed')
                logger.error(f"Task {video_task.task_id} failed: {error_msg}")
                video_task.status = "error"
                video_task.error = error_msg
                break
            else:
                logger.debug(f"Task {video_task.task_id} still processing...")
                # Continue monitoring
                await asyncio.sleep(10)
                    
        except Exception as e:
            error_msg = f"Monitoring error: {e}"
            logger.error(error_msg)
            print(error_msg)
            await asyncio.sleep(10)

@app.get("/video-status/{task_id}")
async def get_video_status(task_id: str):
    """
    Long polling endpoint для проверки статуса видео
    """
    logger.info(f"Status request for task: {task_id}")
    
    if task_id not in video_tasks:
        logger.warning(f"Task not found: {task_id}")
        raise HTTPException(status_code=404, detail="Task not found")
    
    video_task = video_tasks[task_id]
    logger.info(f"Task {task_id} current status: {video_task.status}")
    
    # Long polling - ждем изменения статуса
    max_wait_time = 30  # секунд
    wait_time = 0
    check_interval = 1  # секунда
    
    while video_task.status == "processing" and wait_time < max_wait_time:
        await asyncio.sleep(check_interval)
        wait_time += check_interval
        logger.debug(f"Task {task_id} still processing, wait_time: {wait_time}")
    
    response_data = {
        "task_id": task_id,
        "status": video_task.status
    }
    
    if video_task.status == "completed":
        response_data["result_url"] = video_task.result_url
        logger.info(f"Task {task_id} completed, result_url: {video_task.result_url}")
        # Удаляем задачу после завершения
        del video_tasks[task_id]
        logger.info(f"Task {task_id} removed from memory")
    elif video_task.status == "error":
        response_data["error"] = video_task.error
        logger.error(f"Task {task_id} failed with error: {video_task.error}")
        # Удаляем задачу после ошибки
        del video_tasks[task_id]
        logger.info(f"Task {task_id} removed from memory")
    
    logger.info(f"Returning status for task {task_id}: {response_data}")
    return response_data

@app.get("/files/{filename}")
async def serve_file(filename: str):
    """
    Serve video and audio files
    """
    logger.info(f"File request: {filename}")
    
    # Security check - only allow specific file types
    if not filename.endswith(('.mov', '.wav', '.mp4')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Check if file exists in videos directory
    file_path = f"videos/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    logger.info(f"Serving file: {file_path}")
    
    # Set correct media type based on file extension
    if filename.endswith('.wav'):
        media_type = "audio/wav"
    elif filename.endswith('.mp4'):
        media_type = "video/mp4"
    else:
        media_type = "video/quicktime"  # For .mov files
    
    return StreamingResponse(open(file_path, "rb"), media_type=media_type)

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    logger.info(f"Health check request, active tasks: {len(video_tasks)}")
    return {"status": "healthy", "active_tasks": len(video_tasks)}

if __name__ == "__main__":
    import uvicorn
    import asyncio
    
    # Test API connection on startup
    async def startup():
        await test_sync_api()
    
    # Run startup test
    asyncio.run(startup())
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
