import * as authUtils from './auth';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('Auth Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    test('setTokens stocke les tokens', () => {
      authUtils.setTokens('access_token', 'refresh_token');

      expect(localStorage.getItem('access_token')).toBe('access_token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh_token');
    });

    test('getAccessToken récupère le token d\'accès', () => {
      localStorage.setItem('access_token', 'my_access_token');

      expect(authUtils.getAccessToken()).toBe('my_access_token');
    });

    test('getRefreshToken récupère le token de rafraîchissement', () => {
      localStorage.setItem('refresh_token', 'my_refresh_token');

      expect(authUtils.getRefreshToken()).toBe('my_refresh_token');
    });

    test('clearTokens supprime les tokens', () => {
      authUtils.setTokens('access_token', 'refresh_token');
      authUtils.setUser({ username: 'test' });

      authUtils.clearTokens();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('User Management', () => {
    test('setUser stocke les infos utilisateur', () => {
      const user = { id: 1, username: 'testuser', user_type: 'patient' };
      authUtils.setUser(user);

      expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
    });

    test('getUser récupère les infos utilisateur', () => {
      const user = { id: 1, username: 'testuser', user_type: 'patient' };
      authUtils.setUser(user);

      expect(authUtils.getUser()).toEqual(user);
    });

    test('getUser retourne null si pas d\'utilisateur', () => {
      expect(authUtils.getUser()).toBeNull();
    });
  });

  describe('Authentication Status', () => {
    test('isAuthenticated retourne true si token présent', () => {
      authUtils.setTokens('access_token', 'refresh_token');

      expect(authUtils.isAuthenticated()).toBe(true);
    });

    test('isAuthenticated retourne false si pas de token', () => {
      expect(authUtils.isAuthenticated()).toBe(false);
    });
  });

  describe('Login', () => {
    test('login appelle l\'API et stocke les tokens', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          access: 'access_token',
          refresh: 'refresh_token',
          user: { id: 1, username: 'testuser', user_type: 'patient' },
        }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await authUtils.login('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login/'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(localStorage.getItem('access_token')).toBe('access_token');
      expect(result.user.username).toBe('testuser');
    });

    test('login lance une erreur en cas d\'échec', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ detail: 'Identifiants invalides' }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(authUtils.login('testuser', 'wrongpassword')).rejects.toThrow(
        'Identifiants invalides'
      );
    });
  });

  describe('Register', () => {
    test('register appelle l\'API et stocke les tokens', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        password_confirm: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'patient',
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          access: 'access_token',
          refresh: 'refresh_token',
          user: { id: 2, ...userData },
        }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await authUtils.register(userData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/'),
        expect.any(Object)
      );

      expect(localStorage.getItem('access_token')).toBe('access_token');
      expect(result.user.username).toBe('newuser');
    });
  });

  describe('Logout', () => {
    test('logout appelle l\'API et supprime les tokens', async () => {
      authUtils.setTokens('access_token', 'refresh_token');

      const mockResponse = {
        ok: true,
        json: async () => ({ message: 'Déconnexion réussie' }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await authUtils.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});

