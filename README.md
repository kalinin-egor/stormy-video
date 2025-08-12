# Stormy Video

Полнофункциональное приложение для создания видео с липсинком, использующее Sync.so API.

## Архитектура

Проект состоит из двух частей:
- **Backend**: FastAPI сервер с интеграцией Sync.so API
- **Frontend**: React приложение с современным UI

## Быстрый старт

### 1. Запуск бэкенда

```bash
cd backend
pip install -r requirements.txt
python demo_main.py
```

Бэкенд будет доступен по адресу: http://localhost:8000

### 2. Запуск фронтенда

```bash
cd frontend
npm install
npm start
```

Фронтенд будет доступен по адресу: http://localhost:3000

## API Endpoints

### POST /create-video
Создает видео с липсинком.

**Параметры:**
- `script` (string) - текст сценария
- `video_type` (string) - тип видео: "durov" или "tucker"
- `logo` (file, опционально) - логотип для наложения

### GET /video-status/{task_id}
Long polling endpoint для проверки статуса видео.

### GET /health
Health check endpoint.

## Особенности

- **Автоматическая обрезка видео** по длине аудио
- **Наложение логотипа** на левую половину видео по центру
- **Long polling** для real-time отслеживания прогресса
- **Обработка ошибок** с информативными сообщениями
- **Современный UI** с анимациями и отзывчивым дизайном

## Технологии

### Backend
- FastAPI
- Python 3.12+
- httpx для HTTP запросов
- gTTS для генерации аудио

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Motion (Framer Motion)
- Lucide React для иконок

## Структура проекта

```
stormy-video/
├── backend/
│   ├── main.py              # Основной FastAPI сервер
│   ├── demo_main.py         # Демо версия для тестирования
│   ├── requirements.txt     # Python зависимости
│   ├── videos/              # Видео файлы
│   │   ├── durov.mov
│   │   └── tucker.mov
│   └── README.md
├── frontend/
│   ├── components/          # React компоненты
│   ├── config/             # Конфигурация API
│   ├── services/           # API сервисы
│   ├── styles/             # CSS стили
│   ├── package.json        # Node.js зависимости
│   └── README.md
└── README.md
```

## Разработка

### Добавление новых видео типов

1. Добавьте видео файл в `backend/videos/`
2. Обновите валидацию в `backend/main.py`
3. Добавьте опцию в `frontend/components/VideoGenerator.tsx`

### Интеграция с реальным Sync.so API

1. Замените демо функции в `backend/main.py` на реальные API вызовы
2. Обновите конфигурацию API ключей
3. Протестируйте интеграцию

## Лицензия

MIT License
