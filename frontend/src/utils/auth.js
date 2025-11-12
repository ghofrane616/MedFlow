/**
 * Utilitaires d'authentification JWT pour MedFlow
 * Gestion des tokens, stockage local et requêtes API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Stocke les tokens JWT dans le localStorage
 */
export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

/**
 * Récupère le token d'accès
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Récupère le token de rafraîchissement
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

/**
 * Supprime les tokens du localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

/**
 * Stocke les informations utilisateur
 */
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Récupère les informations utilisateur
 */
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erreur serveur:', error);
      throw new Error(error.detail || JSON.stringify(error) || 'Erreur lors de l\'inscription');
    }

    const data = await response.json();
    setTokens(data.access, data.refresh);
    setUser(data.user);
    return data;
  } catch (error) {
    console.error('Erreur complète:', error);
    throw error;
  }
};

/**
 * Connexion d'un utilisateur
 */
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Identifiants invalides');
    }

    const data = await response.json();
    setTokens(data.access, data.refresh);
    setUser(data.user);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Déconnexion de l'utilisateur
 */
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    clearTokens();
  }
};

/**
 * Rafraîchit le token d'accès
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('Pas de refresh token disponible');
    }

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      throw new Error('Impossible de rafraîchir le token');
    }

    const data = await response.json();
    setTokens(data.access, data.refresh);
    return data.access;
  } catch (error) {
    clearTokens();
    throw error;
  }
};

/**
 * Effectue une requête API authentifiée
 */
export const apiCall = async (endpoint, options = {}) => {
  let accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Non authentifié');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    ...options.headers,
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si le token a expiré, essayer de le rafraîchir
  if (response.status === 401) {
    try {
      accessToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur API');
  }

  return response.json();
};

/**
 * Retourne le chemin du dashboard selon le rôle de l'utilisateur
 */
export const getDashboardPath = () => {
  const user = getUser();
  if (!user) return '/login';

  const dashboardPaths = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    receptionist: '/receptionist/dashboard',
    patient: '/patient/dashboard',
  };

  return dashboardPaths[user.user_type] || '/dashboard';
};

const authUtils = {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  setUser,
  getUser,
  isAuthenticated,
  register,
  login,
  logout,
  refreshAccessToken,
  apiCall,
  getDashboardPath,
};

export default authUtils;

