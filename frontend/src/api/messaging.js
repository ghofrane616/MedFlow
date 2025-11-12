/**
 * API Client pour la Messagerie
 * Gère les conversations et les messages
 */

const API_URL = 'http://localhost:8000/api';

const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Récupère toutes les conversations de l'utilisateur
 */
export const getConversations = async (filters = {}) => {
  const token = getAccessToken();
  try {
    let url = `${API_URL}/conversations/`;
    
    // Ajouter les filtres
    const params = new URLSearchParams();
    if (filters.clinic_id) params.append('clinic', filters.clinic_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.ordering) params.append('ordering', filters.ordering);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    throw error;
  }
};

/**
 * Récupère une conversation spécifique
 */
export const getConversation = async (conversationId) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error);
    throw error;
  }
};

/**
 * Crée une nouvelle conversation
 */
export const createConversation = async (data) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/conversations/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    throw error;
  }
};

/**
 * Marque tous les messages d'une conversation comme lus
 */
export const markConversationAsRead = async (conversationId) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/mark_as_read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors du marquage de la conversation comme lue:', error);
    throw error;
  }
};

/**
 * Ajoute un participant à une conversation
 */
export const addParticipant = async (conversationId, userId) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/add_participant/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'ajout du participant:', error);
    throw error;
  }
};

/**
 * Supprime une conversation
 */
export const deleteConversation = async (conversationId) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error);
    throw error;
  }
};

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Récupère les messages d'une conversation
 */
export const getMessages = async (conversationId, filters = {}) => {
  const token = getAccessToken();
  try {
    let url = `${API_URL}/messages/?conversation=${conversationId}`;
    
    if (filters.ordering) {
      url += `&ordering=${filters.ordering}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    throw error;
  }
};

/**
 * Envoie un nouveau message
 */
export const sendMessage = async (conversationId, content) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/messages/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation: conversationId,
        content: content
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
};

/**
 * Marque un message comme lu
 */
export const markMessageAsRead = async (messageId) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/messages/${messageId}/mark_as_read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors du marquage du message comme lu:', error);
    throw error;
  }
};

/**
 * Supprime un message
 */
export const deleteMessage = async (messageId) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/messages/${messageId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    throw error;
  }
};

