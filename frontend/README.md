# Frontend - Interview Tests System

React приложение для системы интервью.

## Структура

- `src/pages/` - Страницы приложения
- `src/api/` - API клиент для взаимодействия с Django backend
- `nginx.conf` - Конфигурация Nginx для раздачи статики и проксирования

## Разработка

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
```

## Docker

```bash
docker build -t frontend .
docker run -p 80:80 frontend
```

## Отладка проблем

Если frontend не поднимается в Docker:

1. Проверьте логи: `docker-compose logs frontend`
2. Убедитесь, что все файлы на месте
3. Проверьте, что `npm run build` выполняется успешно
4. Проверьте конфигурацию nginx
