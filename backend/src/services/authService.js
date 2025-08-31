const pool = require("../config/db");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const logService = require("./logService");
const JWTService = require("./jwtService");

const SALT_ROUNDS = 10;
const CODE_LENGTH = 6;
const CODE_EXPIRATION_MINUTES = 10;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function registerUser(email, password, role = "user") {
  // Проверка, существует ли пользователь
  const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (userCheck.rows.length > 0) {
    throw new Error("User already exists");
  }

  // Получить id роли
  const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [
    role,
  ]);
  if (roleRes.rows.length === 0) {
    throw new Error("Role not found");
  }
  const roleId = roleRes.rows[0].id;

  // Хешировать пароль
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Создать пользователя (активного по умолчанию)
  const userRes = await pool.query(
    "INSERT INTO users (email, password_hash, role_id, is_email_confirmed, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [email, passwordHash, roleId, true, true] // email сразу подтверждён, пользователь активен
  );
  const userId = userRes.rows[0].id;

  // // Сгенерировать 2FA-код
  // const code = crypto
  //   .randomInt(10 ** (CODE_LENGTH - 1), 10 ** CODE_LENGTH)
  //   .toString();
  // const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60000);
  // await pool.query(
  //   "INSERT INTO twofa_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
  //   [userId, code, expiresAt]
  // );

  // // Отправить email
  // await transporter.sendMail({
  //   from: process.env.EMAIL_USER,
  //   to: email,
  //   subject: "Подтверждение регистрации",
  //   text: `Ваш код подтверждения: ${code}`,
  // });

  await logService.logAction(userId, "register", { email, role });
  return { userId, email };
}

// async function verifyEmailCode(email, code) {
//   // Найти пользователя
//   const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [
//     email,
//   ]);
//   if (userRes.rows.length === 0) throw new Error("User not found");
//   const userId = userRes.rows[0].id;

//   // Найти код
//   const codeRes = await pool.query(
//     "SELECT * FROM twofa_codes WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > NOW()",
//     [userId, code]
//   );
//   if (codeRes.rows.length === 0) throw new Error("Invalid or expired code");

//   // Отметить код как использованный
//   await pool.query("UPDATE twofa_codes SET used = true WHERE id = $1", [
//     codeRes.rows[0].id,
//   ]);

//   // Подтвердить email
//   await pool.query("UPDATE users SET is_email_confirmed = true WHERE id = $1", [
//     userId,
//   ]);

//   await logService.logAction(userId, "verify_email", { email });

//   return true;
// }

// Унифицированный профиль пользователя
function makeUserProfile(user, roleName) {
  return {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
    role_name: roleName || user.role_name || user.role || "user",
    is_email_confirmed: user.is_email_confirmed,
    is_active: user.is_active,
  };
}

async function loginUser(email, password, req = null) {
  // Найти пользователя
  const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (userRes.rows.length === 0) throw new Error("User not found");
  const user = userRes.rows[0];

  // Проверить активность пользователя
  if (!user.is_active) throw new Error("User account is deactivated");

  // Получить имя роли
  const roleRes = await pool.query("SELECT name FROM roles WHERE id = $1", [
    user.role_id,
  ]);
  const role_name = roleRes.rows.length > 0 ? roleRes.rows[0].name : null;

  // Проверить подтверждение email
  // if (!user.is_email_confirmed) throw new Error("Email not confirmed");

  // Проверить пароль
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("Invalid password");

  // Создать профиль пользователя
  const profile = makeUserProfile(user, role_name);

  // Если передан req (сессионная аутентификация), создаем сессию
  if (req) {
    req.session.user = profile;
  }

  // Генерируем JWT токены
  const tokens = JWTService.generateTokens(profile);

  await logService.logAction(user.id, "login", { email });
  return { ...profile, ...tokens };
}

// async function verify2FACode(email, code, req) {
//   // Найти пользователя
//   const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
//     email,
//   ]);
//   if (userRes.rows.length === 0) throw new Error("User not found");
//   const user = userRes.rows[0];

//   // Получить имя роли
//   const roleRes = await pool.query("SELECT name FROM roles WHERE id = $1", [
//     user.role_id,
//   ]);
//   const role_name = roleRes.rows.length > 0 ? roleRes.rows[0].name : null;

//   // Найти код
//   const codeRes = await pool.query(
//     "SELECT * FROM twofa_codes WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > NOW()",
//     [user.id, code]
//   );
//   if (codeRes.rows.length === 0) throw new Error("Invalid or expired code");

//   // Отметить код как использованный
//   await pool.query("UPDATE twofa_codes SET used = true WHERE id = $1", [
//     codeRes.rows[0].id,
//   ]);

//   // Создать сессию
//   req.session.user = {
//     id: user.id,
//     email: user.email,
//     role_id: user.role_id,
//     role_name,
//   };

//   await logService.logAction(user.id, "verify_2fa", { email });

//   return {
//     userId: user.id,
//     email: user.email,
//     role_id: user.role_id,
//     role_name,
//   };
// }

async function setUserRole(email, roleName, adminId) {
  // Найти пользователя
  const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (userRes.rows.length === 0) throw new Error("User not found");
  const user = userRes.rows[0];

  // Получить старую роль
  const oldRoleRes = await pool.query("SELECT name FROM roles WHERE id = $1", [
    user.role_id,
  ]);
  const oldRoleName =
    oldRoleRes.rows.length > 0 ? oldRoleRes.rows[0].name : null;

  // Найти новую роль
  const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [
    roleName,
  ]);
  if (roleRes.rows.length === 0) throw new Error("Role not found");
  const roleId = roleRes.rows[0].id;

  // Проверить, что роль действительно изменилась
  if (oldRoleName === roleName) {
    throw new Error("User already has this role");
  }

  // Обновить роль пользователя
  await pool.query("UPDATE users SET role_id = $1 WHERE id = $2", [
    roleId,
    user.id,
  ]);

  // Логируем с подробной информацией об изменении
  await logService.logAction(adminId, "set_role", {
    target_email: email,
    target_user_id: user.id,
    old_role: oldRoleName,
    new_role: roleName,
    changed_by_admin_id: adminId,
  });

  return {
    userId: user.id,
    email: user.email,
    old_role: oldRoleName,
    new_role: roleName,
  };
}

/**
 * Получить всех пользователей с фильтрацией, поиском и пагинацией
 * @param {Object} options { email, role, is_email_confirmed, is_active, search, limit, offset }
 */
async function getAllUsers(options = {}) {
  let query = `
    SELECT u.id, u.email, r.name as role, u.is_email_confirmed, u.is_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  // Фильтр по email (точное совпадение)
  if (options.email && options.email.trim()) {
    query += ` AND u.email = $${idx++}`;
    params.push(options.email.trim());
  }

  // Фильтр по роли
  if (options.role && options.role.trim()) {
    query += ` AND r.name = $${idx++}`;
    params.push(options.role.trim());
  }

  // Фильтр по подтверждению email
  if (
    options.is_email_confirmed !== undefined &&
    options.is_email_confirmed !== null
  ) {
    query += ` AND u.is_email_confirmed = $${idx++}`;
    params.push(options.is_email_confirmed);
  }

  // Фильтр по активности пользователя
  if (options.is_active !== undefined && options.is_active !== null) {
    query += ` AND u.is_active = $${idx++}`;
    params.push(options.is_active);
  }

  // Поиск по email (частичное совпадение)
  if (options.search && options.search.trim()) {
    query += ` AND u.email ILIKE $${idx++}`;
    params.push(`%${options.search.trim()}%`);
  }

  query += " ORDER BY u.id DESC";

  // Пагинация
  if (options.limit && options.limit > 0) {
    query += ` LIMIT $${idx++}`;
    params.push(parseInt(options.limit));
  }

  if (options.offset && options.offset >= 0) {
    query += ` OFFSET $${idx++}`;
    params.push(parseInt(options.offset));
  }

  console.log("SQL Query:", query);
  console.log("Parameters:", params);

  const res = await pool.query(query, params);
  return res.rows;
}

async function deleteUser(email) {
  const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (userRes.rows.length === 0) throw new Error("User not found");
  await pool.query("DELETE FROM users WHERE email = $1", [email]);
  await logService.logAction(null, "delete_user", { email });
  return { deleted: true, email };
}

/**
 * Активировать/деактивировать пользователя
 * @param {string} email - email пользователя
 * @param {boolean} isActive - статус активности
 * @param {number} adminId - ID администратора, выполняющего действие
 */
async function setUserActiveStatus(email, isActive, adminId) {
  const userRes = await pool.query(
    "SELECT id, is_active FROM users WHERE email = $1",
    [email]
  );
  if (userRes.rows.length === 0) throw new Error("User not found");

  const user = userRes.rows[0];
  if (user.is_active === isActive) {
    throw new Error(`User is already ${isActive ? "active" : "deactivated"}`);
  }

  await pool.query("UPDATE users SET is_active = $1 WHERE email = $2", [
    isActive,
    email,
  ]);

  await logService.logAction(adminId, "set_user_active_status", {
    target_email: email,
    new_status: isActive,
    previous_status: !isActive,
  });

  return {
    email,
    is_active: isActive,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
  };
}

// Google OAuth2: найти или создать пользователя по email
async function findOrCreateGoogleUser(email, profile) {
  // Проверить, есть ли пользователь
  const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (userCheck.rows.length > 0) {
    const user = userCheck.rows[0];
    if (!user.is_active) {
      throw new Error("User account is deactivated");
    }
    // Получить имя роли
    const roleRes = await pool.query("SELECT name FROM roles WHERE id = $1", [
      user.role_id,
    ]);
    const role_name = roleRes.rows.length > 0 ? roleRes.rows[0].name : null;
    return makeUserProfile(user, role_name);
  }
  // Получить id роли (по умолчанию user)
  const roleRes = await pool.query(
    "SELECT id, name FROM roles WHERE name = $1",
    ["user"]
  );
  const roleId = roleRes.rows.length > 0 ? roleRes.rows[0].id : null;
  // Создать пользователя (без пароля, email подтверждён)
  const userRes = await pool.query(
    "INSERT INTO users (email, password_hash, role_id, is_email_confirmed, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [email, "", roleId, true, true]
  );
  await logService.logAction(userRes.rows[0].id, "register_google", {
    email,
    profile,
  });
  const user = userRes.rows[0];
  return makeUserProfile(user, "user");
}

// Получить пользователя по id
async function getUserById(id) {
  const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  if (userRes.rows.length === 0) return null;
  return userRes.rows[0];
}

// Удалить все сессии пользователя по userId
async function logoutUserSessions(userId) {
  // Найти все sid, где sess->'user'->>'id' = userId
  const sessions = await pool.query(
    "SELECT sid FROM session WHERE sess::json->'user'->>'id' = $1",
    [String(userId)]
  );
  for (const row of sessions.rows) {
    await pool.query("DELETE FROM session WHERE sid = $1", [row.sid]);
  }
  await logService.logAction(userId, "admin_logout", { admin: "by_admin" });
  return { count: sessions.rows.length };
}

// Проверить, есть ли активная сессия у пользователя
async function isUserOnline(userId) {
  const res = await pool.query(
    "SELECT COUNT(*) FROM session WHERE sess::json->'user'->>'id' = $1 AND expire > NOW()",
    [String(userId)]
  );
  return Number(res.rows[0].count) > 0;
}

// Получить онлайн-статусы для массива userIds
async function getOnlineStatuses(userIds) {
  if (!userIds.length) return {};
  const res = await pool.query(
    `SELECT sess::json->'user'->>'id' as user_id FROM session WHERE expire > NOW() AND sess::json->'user'->>'id' = ANY($1)`,
    [userIds.map(String)]
  );
  const onlineSet = new Set(res.rows.map((r) => r.user_id));
  const statuses = {};
  for (const id of userIds) {
    statuses[id] = onlineSet.has(String(id));
  }
  return statuses;
}

module.exports = {
  registerUser,
  // verifyEmailCode,
  loginUser,
  // verify2FACode,
  setUserRole,
  getAllUsers,
  deleteUser,
  setUserActiveStatus,
  findOrCreateGoogleUser,
  getUserById,
  logoutUserSessions,
  isUserOnline,
  getOnlineStatuses,
  makeUserProfile,
};
