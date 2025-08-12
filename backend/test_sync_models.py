#!/usr/bin/env python3
"""
Тестовый скрипт для проверки доступных моделей Sync.so
"""

from sync import Sync
from sync.common import GenerationOptions

# Sync.so API configuration
SYNC_API_KEY = "sk-q9wuggzXTPSYRhg9BYLgqg.P9mjD67SKZwrVzdpxMtUgzhinZvezGkF"

# Initialize Sync client
sync_client = Sync(api_key=SYNC_API_KEY)

def test_tts_models():
    """Тестируем различные TTS модели"""
    test_text = "Hello, this is a test of text to speech."
    
    models_to_test = [
        "tts-1",
        "text-to-speech", 
        "speech",
        "tts",
        "audio"
    ]
    
    for model in models_to_test:
        print(f"\n=== Testing model: {model} ===")
        try:
            response = sync_client.generations.create(
                input=[{"type": "text", "text": test_text}],
                model=model,
                options=GenerationOptions(
                    voice="alloy",
                    speed=1.0
                )
            )
            print(f"✅ Success! Job ID: {response.id}")
            print(f"Status: {response.status}")
            
            # Wait for completion
            while True:
                generation = sync_client.generations.get(response.id)
                if generation.status == 'COMPLETED':
                    print(f"✅ Completed! Output URL: {generation.output_url}")
                    break
                elif generation.status == 'FAILED':
                    print(f"❌ Failed: {getattr(generation, 'error', 'Unknown error')}")
                    break
                else:
                    print(f"⏳ Status: {generation.status}")
                    import time
                    time.sleep(2)
                    
        except Exception as e:
            print(f"❌ Error with model {model}: {e}")

def test_available_models():
    """Проверяем доступные модели"""
    print("=== Available Models ===")
    try:
        # Попробуем получить список моделей
        # Это может не работать, но попробуем
        print("Trying to get available models...")
    except Exception as e:
        print(f"Could not get model list: {e}")

if __name__ == "__main__":
    print("Testing Sync.so TTS Models")
    print("=" * 50)
    
    test_available_models()
    test_tts_models()
