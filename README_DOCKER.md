# Инструкция по запуску Docker

## Архитектура

- **frontend** - собирает React приложение и копирует в volume `frontend-dist`
- **nginx** - раздает статику из volume и проксирует запросы к Django
- **web** - Django backend (API)
- **redis** - для WebSocket и channels
- **ai-service** - AI сервис для оценки ответов

## Запуск

```bash
# Сборка и запуск всех сервисов
docker-compose up --build

# Запуск в фоне
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f frontend
docker-compose logs -f nginx
docker-compose logs -f web
```

## Отладка

Если frontend не запускается:

1. Проверьте логи сборки:
   ```bash
   docker-compose logs frontend
   ```

2. Проверьте, что файлы собрались:
   ```bash
   docker-compose exec frontend ls -la /app/dist
   ```

3. Проверьте volume:
   ```bash
   docker volume inspect interviewtestssystem_frontend-dist
   ```

4. Проверьте nginx:
   ```bash
   docker-compose exec nginx ls -la /usr/share/nginx/html
   docker-compose exec nginx nginx -t
   ```

## Пересборка frontend

Если нужно пересобрать frontend:

```bash
docker-compose build frontend
docker-compose up -d frontend
```

## Очистка

```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить volumes (включая frontend-dist)
docker-compose down -v
```
