/**
 * Auth Service SDK
 * Легкая интеграция с сервисом авторизации
 */

class AuthSDK {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3000';
    this.apiURL = `${this.baseURL}/auth/jwt`;
    this.sessionURL = `${this.baseURL}/auth`;
    this.storage = config.storage || 'localStorage';
    this.tokenKey = config.tokenKey || 'auth_tokens';
    this.userKey = config.userKey || 'auth_user';
  }

  /**
   * Получить токены из хранилища
   */
  getTokens() {
    try {
      const tokens = this.storage === 'localStorage' 
        ? localStorage.getItem(this.tokenKey)
        : sessionStorage.getItem(this.tokenKey);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  }

  /**
   * Сохранить токены в хранилище
   */
  setTokens(tokens) {
    try {
      const tokenData = JSON.stringify(tokens);
      if (this.storage === 'localStorage') {
        localStorage.setItem(this.tokenKey, tokenData);
      } else {
        sessionStorage.setItem(this.tokenKey, tokenData);
      }
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  }

  /**
   * Удалить токены из хранилища
   */
  clearTokens() {
    try {
      if (this.storage === 'localStorage') {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
      } else {
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
      }
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Получить пользователя из хранилища
   */
  getUser() {
    try {
      const user = this.storage === 'localStorage' 
        ? localStorage.getItem(this.userKey)
        : sessionStorage.getItem(this.userKey);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Сохранить пользователя в хранилище
   */
  setUser(user) {
    try {
      const userData = JSON.stringify(user);
      if (this.storage === 'localStorage') {
        localStorage.setItem(this.userKey, userData);
      } else {
        sessionStorage.setItem(this.userKey, userData);
      }
    } catch (error) {
      console.error('Error setting user:', error);
    }
  }

  /**
   * HTTP запрос с авторизацией
   */
  async request(url, options = {}) {
    const tokens = this.getTokens();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Попытка обновить токен
        if (tokens?.refreshToken) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Повторяем запрос с новым токеном
            const newTokens = this.getTokens();
            config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return await fetch(url, config);
          }
        }
        // Если не удалось обновить токен, очищаем данные
        this.clearTokens();
        throw new Error('Unauthorized');
      }

      return response;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  /**
   * JWT Регистрация
   */
  async register(email, password, role = 'user') {
    try {
      const response = await fetch(`${this.apiURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * JWT Вход
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Сохраняем токены и пользователя
      this.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Обновление токена
   */
  async refreshToken() {
    try {
      const tokens = this.getTokens();
      if (!tokens?.refreshToken) {
        return false;
      }

      const response = await fetch(`${this.apiURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      // Обновляем токены
      this.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * JWT Выход
   */
  async logout() {
    try {
      const tokens = this.getTokens();
      
      if (tokens?.accessToken) {
        await this.request(`${this.apiURL}/logout`, {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      }

      this.clearTokens();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Получить профиль пользователя
   */
  async getProfile() {
    try {
      const response = await this.request(`${this.apiURL}/profile`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get profile');
      }

      // Обновляем пользователя в хранилище
      this.setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Проверить валидность токена
   */
  async validateToken() {
    try {
      const response = await this.request(`${this.apiURL}/validate`);
      const data = await response.json();
      
      if (!response.ok) {
        return false;
      }

      return data.valid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Проверить, авторизован ли пользователь
   */
  isAuthenticated() {
    const tokens = this.getTokens();
    const user = this.getUser();
    return !!(tokens?.accessToken && user);
  }

  /**
   * Получить текущего пользователя
   */
  getCurrentUser() {
    return this.getUser();
  }

  /**
   * Проверить роль пользователя
   */
  hasRole(role) {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Проверить, является ли пользователь администратором
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Сессионная аутентификация (для совместимости)
   */
  async sessionLogin(email, password) {
    try {
      const response = await fetch(`${this.sessionURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Session login error:', error);
      throw error;
    }
  }

  /**
   * Сессионный выход
   */
  async sessionLogout() {
    try {
      const response = await fetch(`${this.sessionURL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      console.error('Session logout error:', error);
      return false;
    }
  }
}

// Экспорт для разных сред
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = AuthSDK;
} else if (typeof window !== 'undefined') {
  // Браузер
  window.AuthSDK = AuthSDK;
}
