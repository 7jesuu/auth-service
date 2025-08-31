const JWTService = require("../services/jwtService");
const authService = require("../services/authService");

/**
 * Middleware для проверки JWT токена
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access token required" });
    }

    const token = authHeader.substring(7); // Убираем 'Bearer '
    const decoded = JWTService.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Получаем актуальную информацию о пользователе
    const user = await authService.getUserById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: decoded.role,
      jti: decoded.jti,
    };

    next();
  } catch (error) {
    console.error("JWT Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * Middleware для проверки роли
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
};

/**
 * Middleware для проверки admin роли
 */
const requireAdmin = requireRole("admin");

/**
 * Middleware для проверки user роли
 */
const requireUser = requireRole("user");

/**
 * Middleware для проверки refresh токена
 */
const authenticateRefresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = JWTService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Получаем актуальную информацию о пользователе
    const user = await authService.getUserById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: decoded.role,
      jti: decoded.jti,
    };

    next();
  } catch (error) {
    console.error("Refresh token authentication error:", error);
    res.status(401).json({ error: "Refresh authentication failed" });
  }
};

module.exports = {
  authenticateJWT,
  requireRole,
  requireAdmin,
  requireUser,
  authenticateRefresh,
};
