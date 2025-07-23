# Auth Service

Микросервис для аутентификации с поддержкой JWT, OAuth, 2FA, PostgreSQL, Redis, логированием, Swagger и современной frontend частью на React + Vite.

## Структура проекта

- `backend/` — Node.js/Express backend (API, аутентификация, логика, тесты)
- `frontend/` — React + Vite frontend (UI, роутинг, темы, OAuth)
- `k8s/` — Kubernetes манифесты
- `docker-compose.yml` — быстрый запуск всех сервисов

## Быстрый старт (docker-compose)

```sh
git clone https://github.com/7jesuu/auth-service.git
cd auth-service
cp .env.example .env # создайте .env с OAuth и другими переменными
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker-compose up --build
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Swagger: http://localhost:3000/api-docs

## Документация

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## Переменные окружения

- Все секреты и ключи должны храниться только в `.env` файлах (не пушить в git!)

## Лицензия

MIT
