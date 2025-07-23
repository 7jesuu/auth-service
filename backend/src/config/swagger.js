const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description:
      "Документация REST API для сервиса аутентификации и управления пользователями",
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string" },
          role: { type: "string" },
          is_email_confirmed: { type: "boolean" },
        },
      },
      Log: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          email: { type: "string" },
          action: { type: "string" },
          details: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Регистрация пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                  role: { type: "string", example: "user" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          201: { description: "Пользователь зарегистрирован" },
          400: { description: "Ошибка регистрации" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Вход пользователя (создание сессии)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          200: { description: "Успешный вход, сессия создана" },
          400: { description: "Ошибка входа" },
        },
      },
    },
    "/user/me": {
      get: {
        summary: "Информация о текущем пользователе",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Данные пользователя",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          401: { description: "Неавторизован" },
        },
      },
    },
    "/user/logout": {
      post: {
        summary: "Выход из системы",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Успешный выход" },
          401: { description: "Неавторизован" },
        },
      },
    },
    "/user/all-users": {
      get: {
        summary: "Список всех пользователей (только для админа)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "email", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string" } },
          {
            name: "is_email_confirmed",
            in: "query",
            schema: { type: "boolean" },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "offset", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Список пользователей",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Неавторизован" },
          403: { description: "Нет прав" },
        },
      },
    },
    "/user/set-role": {
      post: {
        summary: "Смена роли пользователя (только для админа)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  role: { type: "string" },
                },
                required: ["email", "role"],
              },
            },
          },
        },
        responses: {
          200: { description: "Роль изменена" },
          400: { description: "Ошибка" },
          401: { description: "Неавторизован" },
          403: { description: "Нет прав" },
        },
      },
    },
    "/user/delete-user": {
      delete: {
        summary: "Удаление пользователя (только для админа)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          200: { description: "Пользователь удалён" },
          400: { description: "Ошибка" },
          401: { description: "Неавторизован" },
          403: { description: "Нет прав" },
        },
      },
    },
    "/user/logs": {
      get: {
        summary: "Просмотр логов (только для админа)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "userId", in: "query", schema: { type: "integer" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "dateFrom",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          {
            name: "dateTo",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "offset", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Список логов",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    logs: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Log" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Неавторизован" },
          403: { description: "Нет прав" },
        },
      },
    },
    "/user/logs/export/csv": {
      get: {
        summary: "Экспорт логов в CSV (только для админа)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "userId", in: "query", schema: { type: "integer" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "dateFrom",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          {
            name: "dateTo",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "offset", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "CSV-файл" },
          401: { description: "Неавторизован" },
          403: { description: "Нет прав" },
        },
      },
    },
    "/user/logs/export/xlsx": {
      get: {
        summary: "Экспорт логов в Excel (только для админа)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "userId", in: "query", schema: { type: "integer" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "dateFrom",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          {
            name: "dateTo",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "offset", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Excel-файл" },
          401: { description: "Неавторизован" },
          403: { description: "Нет прав" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
