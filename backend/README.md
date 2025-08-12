# Stormy Video Backend

FastAPI бэкенд для создания видео с липсинком используя Sync.so API.

## Установка

1. Установите зависимости:
```bash
pip install -r requirements.txt
```

2. Убедитесь, что видео файлы находятся в папке `videos/`:
- `videos/durov.mov`
- `videos/tucker.mov`

## Запуск

```bash
python main.py
```

Или с uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### 1. POST /create-video

Создает видео с липсинком.

**Параметры:**
- `script` (string, обязательный) - текст сценария
- `video_type` (string, обязательный) - тип видео: "durov" или "tucker"
- `logo` (file, опциональный) - логотип для наложения

**Пример запроса:**
```bash
curl -X POST "http://localhost:8000/create-video" \
  -H "Content-Type: multipart/form-data" \
  -F "script=Привет, это тестовое видео" \
  -F "video_type=durov" \
  -F "logo=@logo.png"
```

**Ответ:**
```json
{
  "task_id": "uuid-string",
  "status": "processing",
  "message": "Video generation started"
}
```

### 2. GET /video-status/{task_id}

Long polling endpoint для проверки статуса видео.

**Параметры:**
- `task_id` (string, обязательный) - ID задачи

**Пример запроса:**
```bash
curl "http://localhost:8000/video-status/uuid-string"
```

**Ответ (обработка):**
```json
{
  "task_id": "uuid-string",
  "status": "processing"
}
```

**Ответ (завершено):**
```json
{
  "task_id": "uuid-string",
  "status": "completed",
  "result_url": "https://sync.so/video/..."
}
```

**Ответ (ошибка):**
```json
{
  "task_id": "uuid-string",
  "status": "error",
  "error": "Error message"
}
```

### 3. GET /health

Health check endpoint.

**Ответ:**
```json
{
  "status": "healthy",
  "active_tasks": 2
}
```

## Особенности

1. **Автоматическая обрезка видео** - видео обрезается по длине аудио сценария
2. **Наложение логотипа** - если предоставлен логотип, он накладывается на левую половину видео по центру
3. **Long polling** - эндпоинт статуса ждет до 30 секунд изменения статуса
4. **Автоматическая очистка** - временные файлы и завершенные задачи удаляются автоматически

## Интеграция с Sync.so

API использует Sync.so для создания липсинка. Необходимо:
1. Валидный API ключ Sync.so
2. Доступ к API endpoints Sync.so
3. Поддержка загрузки файлов и создания проектов

## Примечания

- Функция `generate_audio_from_text()` требует интеграции с TTS сервисом
- API endpoints Sync.so могут отличаться от предполагаемых
- Рекомендуется добавить валидацию файлов и ограничения размера
