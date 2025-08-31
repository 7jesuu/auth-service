const jwt = require("jsonwebtoken");
const redis = require("redis");
const { v4: uuidv4 } = require("uuid");

// Redis клиент для blacklist токенов
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key";
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

class JWTService {
  /**
   * Генерирует access и refresh токены
   */
  static generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role_name || user.role,
      jti: uuidv4(), // JWT ID для отслеживания
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(
      { ...payload, jti: uuidv4() },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Проверяет access токен
   */
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Проверяем, не в blacklist ли токен
      return this.isTokenBlacklisted(token) ? null : decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Проверяет refresh токен
   */
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

      // Проверяем, не в blacklist ли токен
      return this.isTokenBlacklisted(token) ? null : decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Добавляет токен в blacklist
   */
  static async blacklistToken(token, expiresIn = 3600) {
    try {
      const decoded = jwt.decode(token);
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);

      if (ttl > 0) {
        await redisClient.setEx(`blacklist:${token}`, ttl, "1");
      }
      return true;
    } catch (error) {
      console.error("Error blacklisting token:", error);
      return false;
    }
  }

  /**
   * Проверяет, находится ли токен в blacklist
   */
  static async isTokenBlacklisted(token) {
    try {
      const result = await redisClient.get(`blacklist:${token}`);
      return result === "1";
    } catch (error) {
      console.error("Error checking token blacklist:", error);
      return false;
    }
  }

  /**
   * Обновляет токены
   */
  static async refreshTokens(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error("Invalid refresh token");
    }

    // Добавляем старый refresh токен в blacklist
    await this.blacklistToken(refreshToken);

    // Генерируем новые токены
    const user = {
      id: decoded.id,
      email: decoded.email,
      role_name: decoded.role,
    };

    return this.generateTokens(user);
  }

  /**
   * Логаут - добавляет токены в blacklist
   */
  static async logout(accessToken, refreshToken = null) {
    const promises = [this.blacklistToken(accessToken)];

    if (refreshToken) {
      promises.push(this.blacklistToken(refreshToken));
    }

    await Promise.all(promises);
    return true;
  }

  /**
   * Получает информацию о токене без проверки подписи
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTService;
