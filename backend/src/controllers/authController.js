const authService = require("../services/authService");
const logService = require("../services/logService");
const stringify = require("csv-stringify").stringify;
const ExcelJS = require("exceljs");

// POST /register
async function register(req, res) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const result = await authService.registerUser(email, password, role);
    res.status(201).json({
      message:
        "User registered. Please check your email for the confirmation code.",
      user: result,
    });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "register",
      error: err.message,
      body: req.body,
    });
    res.status(400).json({ message: err.message });
  }
}

// POST /verify-email (отключено)
async function verifyEmail(req, res) {
  res.status(400).json({ message: "2FA временно отключена" });
}

// POST /login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    // req передаём в loginUser для создания сессии
    const result = await authService.loginUser(email, password, req);
    res.status(200).json({ message: "Login successful", user: result });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "login",
      error: err.message,
      body: req.body,
    });
    res.status(400).json({ message: err.message });
  }
}

// POST /verify-2fa (отключено)
async function verify2FA(req, res) {
  res.status(400).json({ message: "2FA временно отключена" });
}

// POST /set-role (только для админа)
async function setUserRole(req, res) {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }
    const result = await authService.setUserRole(
      email,
      role,
      req.session.user.id
    );
    res.status(200).json({ message: "Role updated", result });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "setUserRole",
      error: err.message,
      body: req.body,
    });
    res.status(400).json({ message: err.message });
  }
}

// GET /all-users (только для админа)
async function getAllUsers(req, res) {
  try {
    const {
      email,
      role,
      is_email_confirmed,
      is_active,
      search,
      limit,
      offset,
    } = req.query;

    console.log("Received query params:", req.query);

    const options = {
      email: email && email.trim() ? email.trim() : undefined,
      role: role && role.trim() ? role.trim() : undefined,
      is_email_confirmed:
        is_email_confirmed !== undefined && is_email_confirmed !== null
          ? is_email_confirmed === "true"
          : undefined,
      is_active:
        is_active !== undefined && is_active !== null
          ? is_active === "true"
          : undefined,
      search: search && search.trim() ? search.trim() : undefined,
      limit: limit && !isNaN(limit) ? parseInt(limit) : undefined,
      offset: offset && !isNaN(offset) ? parseInt(offset) : undefined,
    };

    console.log("Processed options:", options);

    const users = await authService.getAllUsers(options);
    res.status(200).json({ users });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "getAllUsers",
      error: err.message,
      query: req.query,
    });
    res.status(500).json({ message: err.message });
  }
}

// DELETE /delete-user (только для админа)
async function deleteUser(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await authService.deleteUser(email);
    res.status(200).json({ message: "User deleted", result });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "deleteUser",
      error: err.message,
      body: req.body,
    });
    res.status(400).json({ message: err.message });
  }
}

// GET /logs (только для админа)
async function getLogs(req, res) {
  try {
    const { userId, action, search, email, limit, offset, dateFrom, dateTo } =
      req.query;

    console.log("Received logs query params:", req.query);

    const options = {
      userId: userId && !isNaN(userId) ? parseInt(userId) : undefined,
      action: action && action.trim() ? action.trim() : undefined,
      search: search && search.trim() ? search.trim() : undefined,
      email: email && email.trim() ? email.trim() : undefined,
      limit: limit && !isNaN(limit) ? parseInt(limit) : undefined,
      offset: offset && !isNaN(offset) ? parseInt(offset) : undefined,
      dateFrom: dateFrom && dateFrom.trim() ? dateFrom.trim() : undefined,
      dateTo: dateTo && dateTo.trim() ? dateTo.trim() : undefined,
    };

    console.log("Processed logs options:", options);

    const logs = await require("../services/logService").getLogs(options);
    res.status(200).json({ logs });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "getLogs",
      error: err.message,
      query: req.query,
    });
    res.status(500).json({ message: err.message });
  }
}

// GET /logs/export/csv (только для админа)
async function exportLogsCsv(req, res) {
  try {
    const { userId, action, search, email, limit, offset, dateFrom, dateTo } =
      req.query;
    const options = {
      userId: userId && !isNaN(userId) ? parseInt(userId) : undefined,
      action: action && action.trim() ? action.trim() : undefined,
      search: search && search.trim() ? search.trim() : undefined,
      email: email && email.trim() ? email.trim() : undefined,
      limit: limit && !isNaN(limit) ? parseInt(limit) : undefined,
      offset: offset && !isNaN(offset) ? parseInt(offset) : undefined,
      dateFrom: dateFrom && dateFrom.trim() ? dateFrom.trim() : undefined,
      dateTo: dateTo && dateTo.trim() ? dateTo.trim() : undefined,
    };
    const logs = await require("../services/logService").getLogs(options);
    const columns = [
      { key: "id", header: "ID" },
      { key: "user_id", header: "User ID" },
      { key: "email", header: "Email" },
      { key: "action", header: "Action" },
      { key: "details", header: "Details" },
      { key: "created_at", header: "Created At" },
    ];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="logs.csv"');
    stringify(
      logs,
      { header: true, columns: columns.map((c) => c.header) },
      (err, output) => {
        if (err) throw err;
        res.send(output);
      }
    );
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "exportLogsCsv",
      error: err.message,
      query: req.query,
    });
    res.status(500).json({ message: err.message });
  }
}

// GET /logs/export/xlsx (только для админа)
async function exportLogsXlsx(req, res) {
  try {
    const { userId, action, search, email, limit, offset, dateFrom, dateTo } =
      req.query;
    const options = {
      userId: userId && !isNaN(userId) ? parseInt(userId) : undefined,
      action: action && action.trim() ? action.trim() : undefined,
      search: search && search.trim() ? search.trim() : undefined,
      email: email && email.trim() ? email.trim() : undefined,
      limit: limit && !isNaN(limit) ? parseInt(limit) : undefined,
      offset: offset && !isNaN(offset) ? parseInt(offset) : undefined,
      dateFrom: dateFrom && dateFrom.trim() ? dateFrom.trim() : undefined,
      dateTo: dateTo && dateTo.trim() ? dateTo.trim() : undefined,
    };
    const logs = await require("../services/logService").getLogs(options);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Logs");
    worksheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "User ID", key: "user_id", width: 10 },
      { header: "Email", key: "email", width: 25 },
      { header: "Action", key: "action", width: 15 },
      { header: "Details", key: "details", width: 40 },
      { header: "Created At", key: "created_at", width: 22 },
    ];
    logs.forEach((log) => worksheet.addRow(log));
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="logs.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "exportLogsXlsx",
      error: err.message,
      query: req.query,
    });
    res.status(500).json({ message: err.message });
  }
}

// POST /set-user-active-status (только для админа)
async function setUserActiveStatus(req, res) {
  try {
    const { email, isActive } = req.body;
    if (!email || isActive === undefined) {
      return res
        .status(400)
        .json({ message: "Email and isActive are required" });
    }
    const result = await authService.setUserActiveStatus(
      email,
      isActive,
      req.session.user.id
    );
    res.status(200).json({ message: result.message, result });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "setUserActiveStatus",
      error: err.message,
      body: req.body,
    });
    res.status(400).json({ message: err.message });
  }
}

// GET /user-audit/:userId (только для админа)
async function getUserAudit(req, res) {
  try {
    const { userId } = req.params;
    const { action, limit, offset, dateFrom, dateTo } = req.query;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    const options = {
      action:
        action && action.toString().trim()
          ? action.toString().trim()
          : undefined,
      limit: limit && !isNaN(limit) ? parseInt(limit) : undefined,
      offset: offset && !isNaN(offset) ? parseInt(offset) : undefined,
      dateFrom:
        dateFrom && dateFrom.toString().trim()
          ? dateFrom.toString().trim()
          : undefined,
      dateTo:
        dateTo && dateTo.toString().trim()
          ? dateTo.toString().trim()
          : undefined,
    };

    const logs = await logService.getUserAuditLogs(parseInt(userId), options);
    res.status(200).json({ logs });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "getUserAudit",
      error: err.message,
      params: req.params,
      query: req.query,
    });
    res.status(500).json({ message: err.message });
  }
}

// POST /admin/logout-user (только для админа)
async function adminLogoutUser(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const result = await authService.logoutUserSessions(userId);
    res
      .status(200)
      .json({ message: "User logged out from all sessions", result });
  } catch (err) {
    await logService.logAction(null, "error", {
      action: "adminLogoutUser",
      error: err.message,
      body: req.body,
    });
    res.status(400).json({ message: err.message });
  }
}

// GET /online-status (только для админа)
async function getUsersOnlineStatus(req, res) {
  try {
    const users = await authService.getAllUsers();
    const userIds = users.map((u) => u.id);
    const statuses = await authService.getOnlineStatuses(userIds);
    res.json({ statuses });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  verify2FA,
  setUserRole,
  getAllUsers,
  deleteUser,
  getLogs,
  exportLogsCsv,
  exportLogsXlsx,
  setUserActiveStatus,
  getUserAudit,
  adminLogoutUser,
  getUsersOnlineStatus,
};
