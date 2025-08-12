#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API эндпоинтов
"""

import requests
import time
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Тест health check эндпоинта"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_create_video():
    """Тест создания видео"""
    print("Testing create video endpoint...")
    
    data = {
        'script': 'Привет, это тестовое видео с липсинком!',
        'video_type': 'durov'
    }
    
    response = requests.post(f"{BASE_URL}/create-video", data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        task_id = response.json()['task_id']
        return task_id
    return None

def test_video_status(task_id):
    """Тест проверки статуса видео"""
    print(f"Testing video status endpoint for task: {task_id}")
    
    response = requests.get(f"{BASE_URL}/video-status/{task_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def main():
    """Основная функция тестирования"""
    print("=== Stormy Video API Test ===\n")
    
    # Тест health endpoint
    test_health()
    
    # Тест создания видео
    task_id = test_create_video()
    
    if task_id:
        # Тест проверки статуса
        test_video_status(task_id)
        
        # Ждем немного и проверяем снова
        print("Waiting 5 seconds...")
        time.sleep(5)
        test_video_status(task_id)

if __name__ == "__main__":
    main()
