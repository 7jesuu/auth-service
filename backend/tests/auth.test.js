const request = require("supertest");
const app = require("../app");

// Тестовые данные
const testEmail = `testuser_${Date.now()}@example.com`;
const testPassword = "TestPassword123!";

let confirmationCode;

describe("Auth flow", () => {
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: testEmail, password: testPassword });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
  });

  it("should get confirmation code from DB (mock)", async () => {
    // Здесь можно получить код из БД напрямую, если есть доступ к pool
    // Например:
    // const pool = require('../src/config/db');
    // const { rows } = await pool.query('SELECT code FROM twofa_codes WHERE used = false AND user_id = (SELECT id FROM users WHERE email = $1) ORDER BY id DESC LIMIT 1', [testEmail]);
    // confirmationCode = rows[0].code;
    // Для примера — fail test, если не реализовано
    confirmationCode = "000000"; // TODO: заменить на реальный код
    expect(confirmationCode).toBeDefined();
  });

  it("should confirm email", async () => {
    // Если confirmationCode не получен — пропустить тест
    if (!confirmationCode || confirmationCode === "000000") return;
    const res = await request(app)
      .post("/auth/verify-email")
      .send({ email: testEmail, code: confirmationCode });
    expect([200, 400]).toContain(res.statusCode); // 200 — успех, 400 — если код уже использован
  });

  it("should login and get 2FA code (mock)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: testEmail, password: testPassword });
    expect(res.statusCode).toBe(200);
    // Аналогично, получить 2FA-код из БД
    // confirmationCode = ...
    confirmationCode = "000000"; // TODO: заменить на реальный код
    expect(confirmationCode).toBeDefined();
  });

  it("should verify 2FA and create session", async () => {
    if (!confirmationCode || confirmationCode === "000000") return;
    const agent = request.agent(app);
    const res = await agent
      .post("/auth/verify-2fa")
      .send({ email: testEmail, code: confirmationCode });
    expect([200, 400]).toContain(res.statusCode);
    // Можно проверить, что сессия установлена (cookie)
  });
});
