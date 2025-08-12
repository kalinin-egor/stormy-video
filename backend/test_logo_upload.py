#!/usr/bin/env python3
"""
Тестовый скрипт для проверки загрузки логотипа
"""

import requests
import os

BASE_URL = "http://localhost:8000"

def test_logo_upload():
    """Тест загрузки логотипа"""
    print("Testing logo upload...")
    
    # Create a simple test image
    test_image_path = "test_logo.png"
    
    # Create a simple PNG file for testing
    with open(test_image_path, "wb") as f:
        # Simple PNG header
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(b'\x00\x00\x00\x0D')  # IHDR chunk length
        f.write(b'IHDR')
        f.write(b'\x00\x00\x00\x10')  # width: 16
        f.write(b'\x00\x00\x00\x10')  # height: 16
        f.write(b'\x08\x02\x00\x00\x00')  # bit depth, color type, etc.
        f.write(b'\x00\x00\x00\x00')  # CRC placeholder
    
    print(f"Created test image: {test_image_path}")
    print(f"Image size: {os.path.getsize(test_image_path)} bytes")
    
    # Test the upload
    data = {
        'script': 'Test script with logo',
        'video_type': 'durov'
    }
    
    files = {
        'logo': ('test_logo.png', open(test_image_path, 'rb'), 'image/png')
    }
    
    try:
        response = requests.post(f"{BASE_URL}/create-video", data=data, files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            task_id = response.json()['task_id']
            print(f"Task ID: {task_id}")
            
            # Check status
            status_response = requests.get(f"{BASE_URL}/video-status/{task_id}")
            print(f"Status response: {status_response.json()}")
            
    except Exception as e:
        print(f"Error: {e}")
    
    # Clean up
    if os.path.exists(test_image_path):
        os.remove(test_image_path)
        print(f"Removed test image: {test_image_path}")

if __name__ == "__main__":
    test_logo_upload()
