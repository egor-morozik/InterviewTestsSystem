# Interview Tests System

Система для проведения интервью и тестирования кандидатов.

## Архитектура

- **Backend**: Django REST Framework (API)
- **Frontend**: React (Vite)
- **Web Server**: Nginx (раздача статики и проксирование)
- **Database**: SQLite
- **WebSocket**: Django Channels + Redis
- **AI Service**: FastAPI (отдельный сервис)

## Структура проекта

```
├── backend/              # Django приложение
│   ├── candidate_interface/  # Интерфейс кандидата
│   ├── interviewer_interface/ # Интерфейс интервьюера
│   └── config/           # Настройки Django
├── frontend/             # React приложение
│   ├── src/
│   │   ├── pages/       # Страницы приложения
│   │   └── api/         # API клиент
│   └── nginx.conf        # Конфигурация Nginx
├── ai-service/           # AI сервис для оценки ответов
└── docker-compose.yml    # Docker Compose конфигурация
```

## Запуск проекта

### Требования

- Docker и Docker Compose
- Переменные окружения (опционально):
  - `GROQ_API_KEY`
  - `QDRANT_URL`
  - `QDRANT_API_KEY`
  - `EMAIL_HOST_PASSWORD`

### Запуск

```bash
docker-compose up --build
```

После запуска:
- Frontend доступен на: http://localhost
- Django Admin доступен на: http://localhost/admin/
- API доступен на: http://localhost/api/

## API Endpoints

### Candidate API (`/api/candidate/`)

- `GET /test/<uuid>/session/` - Получить сессию теста
- `GET /test/<uuid>/question/<id>/` - Получить вопрос
- `POST /test/<uuid>/question/<id>/answer/` - Отправить ответ
- `POST /test/<uuid>/finish/` - Завершить тест
- `POST /log-switch/<uuid>/` - Логировать переключение вкладки
- `GET /session/<uuid>/` - Получить сессию интервью (для интервьюеров)

### Interviewer API (`/api/interviewer/`)

- `GET /templates/` - Список шаблонов тестов
- `GET /templates/<id>/` - Детали шаблона

## Разработка

### Backend

```bash
cd backend
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Миграции

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Админка Django

Доступна по адресу `/admin/` после создания суперпользователя:

```bash
cd backend
python manage.py createsuperuser
```

## Документация

- **[USER_GUIDE.md](USER_GUIDE.md)** - Подробное руководство пользователя
- **[README_DOCKER.md](README_DOCKER.md)** - Инструкции по Docker

## Дизайн

Платформа использует минималистичный современный дизайн с:
- Чистым и понятным интерфейсом
- Адаптивной версткой
- Интуитивной навигацией
- Визуальной обратной связью

## Функциональность

### Для HR и Tech Lead
- Создание тестовых шаблонов
- Создание вопросов разных типов (текст, выбор, код)
- Назначение тестов кандидатам
- Проведение технических интервью в реальном времени
- Просмотр результатов и оценка ответов

### Для кандидатов
- Прохождение автоматических тестов
- Участие в технических интервью
- Совместное редактирование кода с интервьюером
- Чат в реальном времени
- Запуск кода с просмотром результатов
