#!/usr/bin/env python3
"""
Тест для проверки всех доступных моделей в Sync.so
"""

from sync import Sync

# Sync.so API configuration
SYNC_API_KEY = "sk-q9wuggzXTPSYRhg9BYLgqg.P9mjD67SKZwrVzdpxMtUgzhinZvezGkF"

# Initialize Sync client
sync_client = Sync(api_key=SYNC_API_KEY)

def test_known_models():
    """Тестируем известные модели Sync.so"""
    known_models = [
        "lipsync-2",
        "lipsync-1", 
        "lipsync",
        "video",
        "audio",
        "text",
        "speech",
        "tts",
        "tts-1",
        "text-to-speech",
        "voice",
        "generate"
    ]
    
    for model in known_models:
        print(f"\n=== Testing model: {model} ===")
        try:
            # Try with simple text input
            response = sync_client.generations.create(
                input=["Hello world"],
                model=model
            )
            print(f"✅ Success! Job ID: {response.id}")
            print(f"Status: {response.status}")
            
        except Exception as e:
            print(f"❌ Error: {e}")

def test_lipsync_with_text():
    """Тестируем lipsync с текстом"""
    print("\n=== Testing lipsync-2 with text ===")
    try:
        response = sync_client.generations.create(
            input=["Hello world"],
            model="lipsync-2"
        )
        print(f"✅ Success! Job ID: {response.id}")
        print(f"Status: {response.status}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("Testing Available Sync.so Models")
    print("=" * 40)
    
    test_known_models()
    test_lipsync_with_text()
