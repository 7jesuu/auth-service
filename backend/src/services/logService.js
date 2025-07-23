const pool = require("../config/db");

/**
 * Логирует действие пользователя
 * @param {number|null} userId - id пользователя (или null для системных событий)
 * @param {string} action - действие (например, 'register', 'login', 'set_role', 'delete_user', 'error')
 * @param {string|object} details - детали (строка или объект, будет сохранён как строка)
 */
async function logAction(userId, action, details) {
  await pool.query(
    "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
    [
      userId,
      action,
      typeof details === "object" ? JSON.stringify(details) : details,
    ]
  );
}

/**
 * Получить логи с фильтрацией, поиском и пагинацией
 * @param {Object} options { userId, action, search, email, limit, offset, dateFrom, dateTo }
 */
async function getLogs(options = {}) {
  let query = `
    SELECT l.id, l.user_id, l.action, l.details, l.created_at, u.email
    FROM logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  // Фильтр по ID пользователя
  if (options.userId && !isNaN(options.userId)) {
    query += ` AND l.user_id = $${idx++}`;
    params.push(parseInt(options.userId));
  }
  
  // Фильтр по действию (частичное совпадение)
  if (options.action && options.action.trim()) {
    query += ` AND l.action ILIKE $${idx++}`;
    params.push(`%${options.action.trim()}%`);
  }
  
  // Фильтр по email (частичное совпадение)
  if (options.email && options.email.trim()) {
    query += ` AND u.email ILIKE $${idx++}`;
    params.push(`%${options.email.trim()}%`);
  }
  
  // Поиск по деталям и email (частичное совпадение)
  if (options.search && options.search.trim()) {
    query += ` AND (l.details ILIKE $${idx++} OR u.email ILIKE $${idx++})`;
    params.push(`%${options.search.trim()}%`);
    params.push(`%${options.search.trim()}%`);
  }
  
  // Фильтр по дате (от)
  if (options.dateFrom && options.dateFrom.trim()) {
    query += ` AND l.created_at >= $${idx++}`;
    params.push(options.dateFrom.trim());
  }
  
  // Фильтр по дате (до)
  if (options.dateTo && options.dateTo.trim()) {
    query += ` AND l.created_at <= $${idx++}`;
    params.push(options.dateTo.trim());
  }
  
  query += " ORDER BY l.created_at DESC";
  
  // Пагинация
  if (options.limit && options.limit > 0) {
    query += ` LIMIT $${idx++}`;
    params.push(parseInt(options.limit));
  }
  
  if (options.offset && options.offset >= 0) {
    query += ` OFFSET $${idx++}`;
    params.push(parseInt(options.offset));
  }

  console.log('Logs SQL Query:', query);
  console.log('Logs Parameters:', params);
  
  const res = await pool.query(query, params);
  return res.rows;
}

/**
 * Получить историю действий конкретного пользователя
 * @param {number} userId - ID пользователя
 * @param {Object} options { limit, offset, action, dateFrom, dateTo }
 */
async function getUserAuditLogs(userId, options = {}) {
  let query = `
    SELECT l.id, l.user_id, l.action, l.details, l.created_at, u.email
    FROM logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.user_id = $1
  `;
  const params = [userId];
  let idx = 2;

  // Фильтр по действию
  if (options.action && options.action.trim()) {
    query += ` AND l.action ILIKE $${idx++}`;
    params.push(`%${options.action.trim()}%`);
  }
  
  // Фильтр по дате (от)
  if (options.dateFrom && options.dateFrom.trim()) {
    query += ` AND l.created_at >= $${idx++}`;
    params.push(options.dateFrom.trim());
  }
  
  // Фильтр по дате (до)
  if (options.dateTo && options.dateTo.trim()) {
    query += ` AND l.created_at <= $${idx++}`;
    params.push(options.dateTo.trim());
  }
  
  query += " ORDER BY l.created_at DESC";
  
  // Пагинация
  if (options.limit && options.limit > 0) {
    query += ` LIMIT $${idx++}`;
    params.push(parseInt(options.limit));
  }
  
  if (options.offset && options.offset >= 0) {
    query += ` OFFSET $${idx++}`;
    params.push(parseInt(options.offset));
  }

  console.log('User Audit SQL Query:', query);
  console.log('User Audit Parameters:', params);
  
  const res = await pool.query(query, params);
  return res.rows;
}

module.exports = { logAction, getLogs, getUserAuditLogs };
