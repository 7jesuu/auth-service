# Auth Service Backend

## Описание

Node.js backend для сервиса аутентификации с поддержкой JWT, OAuth, 2FA, PostgreSQL, Redis, логированием и тестами.

## Запуск локально

```sh
cd backend
cp .env.example .env # создайте .env файл с нужными переменными
npm install # или yarn install
npm start   # или yarn start
```

## Переменные окружения

- `PORT` — порт сервера (по умолчанию 3000)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — настройки PostgreSQL
- `REDIS_HOST`, `REDIS_PORT` — настройки Redis
- `SESSION_SECRET` — секрет для сессий
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` — SMTP для отправки писем
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — OAuth Google

## Тесты

```sh
npm test # или yarn test
```

## Документация API

Swagger доступен по адресу `/api-docs` после запуска сервера.
