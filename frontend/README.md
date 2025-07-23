# Auth Service Frontend

## Описание

Frontend (React + Vite) для сервиса аутентификации. Поддерживает регистрацию, вход, 2FA, OAuth, профиль пользователя, админ-панель и смену темы.

## Запуск локально

```sh
cd frontend
cp .env.example .env # создайте .env файл с нужными переменными
npm install # или yarn install
npm run dev # или yarn dev
```

## Переменные окружения

- `VITE_API_URL` — адрес backend API (например, http://localhost:3000)

## Сборка

```sh
npm run build # или yarn build
```

## Деплой

Собранные файлы находятся в папке `dist/`. Используйте nginx или любой другой web-сервер для публикации.
