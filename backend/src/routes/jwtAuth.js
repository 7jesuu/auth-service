const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const JWTService = require("../services/jwtService");
const {
  authenticateJWT,
  authenticateRefresh,
  requireAdmin,
  requireUser,
} = require("../middleware/jwtAuth");
const {
  authLimiter,
  registerLimiter,
  apiLimiter,
} = require("../middleware/rateLimiter");
const logService = require("../services/logService");

/**
 * @swagger
 * /auth/jwt/login:
 *   post:
 *     summary: JWT Login
 *     tags: [JWT Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many attempts
 */
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await authService.loginUser(email, password);

    res.json({
      success: true,
      user: {
        id: result.id,
        email: result.email,
        role: result.role_name,
        is_email_confirmed: result.is_email_confirmed,
        is_active: result.is_active,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("JWT Login error:", error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/jwt/register:
 *   post:
 *     summary: JWT Register
 *     tags: [JWT Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 default: user
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid data
 *       409:
 *         description: User already exists
 *       429:
 *         description: Too many attempts
 */
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const result = await authService.registerUser(email, password, role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.userId,
      email: result.email,
    });
  } catch (error) {
    console.error("JWT Register error:", error);
    if (error.message === "User already exists") {
      res.status(409).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /auth/jwt/refresh:
 *   post:
 *     summary: Refresh JWT tokens
 *     tags: [JWT Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", authenticateRefresh, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await JWTService.refreshTokens(refreshToken);

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/jwt/logout:
 *   post:
 *     summary: JWT Logout
 *     tags: [JWT Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authenticateJWT, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.substring(7);
    const { refreshToken } = req.body;

    await JWTService.logout(accessToken, refreshToken);

    await logService.logAction(req.user.id, "jwt_logout", {
      method: "jwt",
      hasRefreshToken: !!refreshToken,
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("JWT Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * @swagger
 * /auth/jwt/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [JWT Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", authenticateJWT, apiLimiter, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const roleRes = await pool.query("SELECT name FROM roles WHERE id = $1", [
      user.role_id,
    ]);
    const role_name = roleRes.rows.length > 0 ? roleRes.rows[0].name : null;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: role_name,
        is_email_confirmed: user.is_email_confirmed,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

/**
 * @swagger
 * /auth/jwt/validate:
 *   get:
 *     summary: Validate JWT token
 *     tags: [JWT Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid token
 */
router.get("/validate", authenticateJWT, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
