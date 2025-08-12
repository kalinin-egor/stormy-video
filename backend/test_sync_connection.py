#!/usr/bin/env python3
"""
Простой тест подключения к Sync.so
"""

from sync import Sync

# Sync.so API configuration
SYNC_API_KEY = "sk-q9wuggzXTPSYRhg9BYLgqg.P9mjD67SKZwrVzdpxMtUgzhinZvezGkF"

def test_connection():
    """Тестируем подключение к Sync.so"""
    try:
        # Initialize Sync client
        sync_client = Sync(api_key=SYNC_API_KEY)
        print("✅ Sync client initialized successfully")
        
        # Try a simple generation
        print("Testing simple generation...")
        response = sync_client.generations.create(
            input=["Hello world"],
            model="tts"
        )
        print(f"✅ Generation created: {response.id}")
        print(f"Status: {response.status}")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Sync.so Connection")
    print("=" * 30)
    test_connection()
