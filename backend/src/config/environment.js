const dotenv = require("dotenv");

// Загружаем переменные окружения
dotenv.config();

const config = {
  // Основные настройки
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  // База данных
  DATABASE: {
    host: process.env.PGHOST || "localhost",
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "123456",
    database: process.env.PGDATABASE || "auth_db",
  },

  // Redis
  REDIS: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // JWT
  JWT: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key",
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  },

  // Сессии
  SESSION: {
    secret: process.env.SESSION_SECRET || "supersecret",
    maxAge: 1000 * 60 * 60 * 24, // 24 часа
  },

  // Email
  EMAIL: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    secure: false,
  },

  // OAuth
  OAUTH: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/auth/google/callback",
    },
  },

  // CORS
  CORS: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost", "http://localhost:80", "http://localhost:5173"],
    credentials: true,
  },

  // Rate Limiting
  RATE_LIMIT: {
    auth: {
      points: 5,
      duration: 15 * 60, // 15 минут
      blockDuration: 60 * 60, // 1 час
    },
    register: {
      points: 3,
      duration: 60 * 60, // 1 час
      blockDuration: 24 * 60 * 60, // 24 часа
    },
    api: {
      points: 100,
      duration: 60, // 1 минута
    },
    oauth: {
      points: 10,
      duration: 60 * 60, // 1 час
      blockDuration: 60 * 60, // 1 час
    },
  },

  // Логирование
  LOGGING: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "json",
  },

  // Безопасность
  SECURITY: {
    bcryptRounds: 10,
    passwordMinLength: 6,
    enable2FA: process.env.ENABLE_2FA === "true",
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === "true",
  },
};

// Проверяем обязательные переменные окружения
const requiredEnvVars = ["JWT_SECRET", "JWT_REFRESH_SECRET", "SESSION_SECRET"];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0 && config.NODE_ENV === "production") {
  console.error("Missing required environment variables:", missingVars);
  process.exit(1);
}

module.exports = config;
