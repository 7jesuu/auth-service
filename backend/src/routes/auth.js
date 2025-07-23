const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Регистрация пользователя
router.post("/register", authController.register);

// Подтверждение email через 2FA-код
router.post("/verify-email", authController.verifyEmail);

// Логин пользователя (отправка 2FA-кода)
router.post("/login", authController.login);

// Подтверждение 2FA-кода и создание сессии
router.post("/verify-2fa", authController.verify2FA);

module.exports = router;
