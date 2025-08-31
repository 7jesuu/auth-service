# Auth Service - Масштабируемый сервис авторизации

Полнофункциональный микросервис для аутентификации с поддержкой JWT, OAuth, 2FA, PostgreSQL, Redis, логированием, Swagger и современной frontend частью на React + Vite.

## 🚀 Возможности

### 🔐 Аутентификация
- **JWT токены** (Access + Refresh)
- **Сессионная аутентификация** (для совместимости)
- **OAuth2** (Google)
- **2FA** (двухфакторная аутентификация)
- **Email верификация**

### 🛡️ Безопасность
- **Rate Limiting** (ограничение частоты запросов)
- **Token Blacklisting** (черный список токенов)
- **Password Hashing** (bcrypt)
- **CORS настройки**
- **Ролевая система** (user/admin)

### 📊 Масштабируемость
- **Микросервисная архитектура**
- **Docker + Kubernetes**
- **PostgreSQL + Redis**
- **Горизонтальное масштабирование**
- **Load Balancing готовность**

### 🔧 Интеграция
- **JavaScript SDK** для легкой интеграции
- **REST API** с Swagger документацией
- **Примеры интеграции**
- **Поддержка браузера и Node.js**

## 📁 Структура проекта

```
auth-service/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Конфигурации
│   │   ├── controllers/    # Контроллеры
│   │   ├── middleware/     # Middleware (JWT, Rate Limiting)
│   │   ├── routes/         # API маршруты
│   │   └── services/       # Бизнес-логика
│   ├── tests/              # Тесты
│   └── package.json
├── frontend/               # React + Vite frontend
├── k8s/                   # Kubernetes манифесты
├── sdk/                   # JavaScript SDK
├── examples/              # Примеры интеграции
└── docker-compose.yml     # Быстрый запуск
```

## 🚀 Быстрый старт

### 1. Клонирование и настройка

```bash
git clone https://github.com/your-repo/auth-service.git
cd auth-service

# Создание .env файлов
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Настройка переменных окружения

```bash
# backend/.env
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
SESSION_SECRET=your-super-secret-session-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Запуск с Docker Compose

```bash
docker-compose up --build
```

**Доступные сервисы:**
- Backend API: http://localhost:3000
- Frontend: http://localhost:80
- Swagger: http://localhost:3000/api-docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## 🔌 API Endpoints

### JWT Аутентификация

```bash
# Регистрация
POST /auth/jwt/register
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}

# Вход
POST /auth/jwt/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Обновление токена
POST /auth/jwt/refresh
{
  "refreshToken": "your-refresh-token"
}

# Выход
POST /auth/jwt/logout
Authorization: Bearer your-access-token

# Профиль пользователя
GET /auth/jwt/profile
Authorization: Bearer your-access-token

# Валидация токена
GET /auth/jwt/validate
Authorization: Bearer your-access-token
```

### Сессионная аутентификация

```bash
# Вход
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Выход
POST /auth/logout
```

## 📦 JavaScript SDK

### Установка

```html
<!-- Браузер -->
<script src="https://your-domain.com/sdk/auth-sdk.js"></script>
```

```bash
# Node.js
npm install auth-service-sdk
```

### Использование

```javascript
// Инициализация
const auth = new AuthSDK({
  baseURL: 'http://localhost:3000',
  storage: 'localStorage' // или 'sessionStorage'
});

// Регистрация
try {
  await auth.register('user@example.com', 'password123', 'user');
  console.log('Registration successful');
} catch (error) {
  console.error('Registration failed:', error.message);
}

// Вход
try {
  const result = await auth.login('user@example.com', 'password123');
  console.log('Login successful', result.user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Проверка аутентификации
if (auth.isAuthenticated()) {
  const user = auth.getCurrentUser();
  console.log('Current user:', user);
}

// Проверка роли
if (auth.isAdmin()) {
  console.log('User is admin');
}

// Авторизованный запрос
try {
  const response = await auth.request('/api/protected-endpoint');
  const data = await response.json();
} catch (error) {
  console.error('Request failed:', error);
}

// Выход
await auth.logout();
```

## 🐳 Docker & Kubernetes

### Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f backend

# Остановка
docker-compose down
```

### Kubernetes

```bash
# Создание namespace
kubectl apply -f k8s/namespace.yaml

# Применение секретов
kubectl apply -f k8s/secret.yaml

# Развертывание сервисов
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Настройка Ingress
kubectl apply -f k8s/ingress.yaml
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `JWT_SECRET` | Секрет для JWT токенов | - |
| `JWT_REFRESH_SECRET` | Секрет для refresh токенов | - |
| `ACCESS_TOKEN_EXPIRY` | Время жизни access токена | 15m |
| `REFRESH_TOKEN_EXPIRY` | Время жизни refresh токена | 7d |
| `SESSION_SECRET` | Секрет для сессий | - |
| `CORS_ORIGINS` | Разрешенные домены | localhost |
| `ENABLE_2FA` | Включить 2FA | false |
| `ENABLE_EMAIL_VERIFICATION` | Включить верификацию email | false |

### Rate Limiting

```javascript
// Настройки по умолчанию
{
  auth: { points: 5, duration: 15 * 60 },      // 5 попыток за 15 минут
  register: { points: 3, duration: 60 * 60 },   // 3 попытки за час
  api: { points: 100, duration: 60 },           // 100 запросов за минуту
  oauth: { points: 10, duration: 60 * 60 }      // 10 попыток за час
}
```

## 🧪 Тестирование

```bash
# Запуск тестов
cd backend
npm test

# Запуск с покрытием
npm run test:coverage
```

## 📚 Примеры интеграции

Смотрите папку `examples/` для полных примеров интеграции:

- `integration-example.html` - Полный пример с JWT и сессиями
- `react-example/` - Пример интеграции с React
- `vue-example/` - Пример интеграции с Vue.js

## 🔒 Безопасность

### Рекомендации для продакшена

1. **Измените все секретные ключи**
2. **Настройте HTTPS**
3. **Используйте сильные пароли**
4. **Включите 2FA**
5. **Настройте мониторинг**
6. **Регулярно обновляйте зависимости**

### Мониторинг

```bash
# Health check
curl http://localhost:3000/health

# Логи
docker-compose logs -f backend
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 Поддержка

- **Документация**: [Wiki](https://github.com/your-repo/auth-service/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/auth-service/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/auth-service/discussions)

---

**Auth Service** - Универсальное решение для аутентификации в любом проекте! 🔐✨
