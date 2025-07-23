const express = require("express");
const router = express.Router();
const { isAuthenticated, hasRole } = require("../middleware/auth");
const {
  adminLogoutUser,
  getUsersOnlineStatus,
} = require("../controllers/authController");

// Получить информацию о текущем пользователе
router.get("/me", isAuthenticated, (req, res) => {
  res.json({ user: req.session.user });
});

// Пример защищённого роута только для админов
router.get("/admin", isAuthenticated, hasRole("admin"), (req, res) => {
  res.json({ message: "Welcome, admin!" });
});

// Выход
router.post("/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout error" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

// Смена роли пользователя (только для админа)
router.post(
  "/set-role",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").setUserRole
);

// Получить всех пользователей (только для админа)
router.get(
  "/all-users",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").getAllUsers
);

// Удалить пользователя по email (только для админа)
router.delete(
  "/delete-user",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").deleteUser
);

// Просмотр логов (только для админа)
router.get(
  "/logs",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").getLogs
);

// Экспорт логов в CSV (только для админа)
router.get(
  "/logs/export/csv",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").exportLogsCsv
);
// Экспорт логов в Excel (только для админа)
router.get(
  "/logs/export/xlsx",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").exportLogsXlsx
);

// Активировать/деактивировать пользователя (только для админа)
router.post(
  "/set-user-active-status",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").setUserActiveStatus
);

// Получить аудит пользователя (только для админа)
router.get(
  "/user-audit/:userId",
  isAuthenticated,
  hasRole("admin"),
  require("../controllers/authController").getUserAudit
);

// Разлогинить пользователя (только для админа)
router.post(
  "/admin/logout-user",
  isAuthenticated,
  hasRole("admin"),
  adminLogoutUser
);

// Получить онлайн-статусы всех пользователей (только для админа)
router.get(
  "/online-status",
  isAuthenticated,
  hasRole("admin"),
  getUsersOnlineStatus
);

module.exports = router;
