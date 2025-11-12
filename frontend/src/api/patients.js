// API pour les patients
import { getAccessToken } from '../utils/auth';

const API_URL = 'http://localhost:8000/api';

// Lister tous les patients
export const getPatients = async () => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des patients');
    return await response.json();
  } catch (error) {
    console.error('Erreur getPatients:', error);
    throw error;
  }
};

// Récupérer un patient spécifique
export const getPatient = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Patient non trouvé');
    return await response.json();
  } catch (error) {
    console.error('Erreur getPatient:', error);
    throw error;
  }
};

// Récupérer mon profil patient
export const getMyProfile = async () => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/my_profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Profil non trouvé');
    return await response.json();
  } catch (error) {
    console.error('Erreur getMyProfile:', error);
    throw error;
  }
};

// Créer un patient
export const createPatient = async (data) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la création');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur createPatient:', error);
    throw error;
  }
};

// Modifier un patient
export const updatePatient = async (id, data) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la modification');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur updatePatient:', error);
    throw error;
  }
};

// Supprimer un patient
export const deletePatient = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression');
    return response.status === 204;
  } catch (error) {
    console.error('Erreur deletePatient:', error);
    throw error;
  }
};

// Récupérer l'historique médical
export const getMedicalHistory = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/${id}/medical_history/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Historique non trouvé');
    return await response.json();
  } catch (error) {
    console.error('Erreur getMedicalHistory:', error);
    throw error;
  }
};

// Mettre à jour les infos médicales
export const updateMedicalInfo = async (id, data) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/patients/${id}/update_medical_info/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la mise à jour');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur updateMedicalInfo:', error);
    throw error;
  }
};

