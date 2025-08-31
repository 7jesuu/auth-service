const { RateLimiterRedis } = require("rate-limiter-flexible");
const redis = require("redis");

// Redis клиент для rate limiting
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().catch(console.error);

// Rate limiter для аутентификации
const authRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "auth",
  points: 5, // Количество попыток
  duration: 15 * 60, // За 15 минут
  blockDuration: 60 * 60, // Блокировка на 1 час
});

// Rate limiter для регистрации
const registerRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "register",
  points: 3, // Количество попыток
  duration: 60 * 60, // За 1 час
  blockDuration: 24 * 60 * 60, // Блокировка на 24 часа
});

// Rate limiter для API запросов
const apiRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "api",
  points: 100, // Количество запросов
  duration: 60, // За 1 минуту
});

// Rate limiter для OAuth
const oauthRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "oauth",
  points: 10, // Количество попыток
  duration: 60 * 60, // За 1 час
  blockDuration: 60 * 60, // Блокировка на 1 час
});

/**
 * Middleware для ограничения попыток аутентификации
 */
const authLimiter = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await authRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      error: "Too many authentication attempts",
      retryAfter: secs,
    });
  }
};

/**
 * Middleware для ограничения попыток регистрации
 */
const registerLimiter = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await registerRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      error: "Too many registration attempts",
      retryAfter: secs,
    });
  }
};

/**
 * Middleware для ограничения API запросов
 */
const apiLimiter = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await apiRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      error: "Too many requests",
      retryAfter: secs,
    });
  }
};

/**
 * Middleware для ограничения OAuth запросов
 */
const oauthLimiter = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await oauthRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      error: "Too many OAuth attempts",
      retryAfter: secs,
    });
  }
};

module.exports = {
  authLimiter,
  registerLimiter,
  apiLimiter,
  oauthLimiter,
};
