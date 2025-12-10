import { getAccessToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Récupérer toutes les ordonnances (selon le rôle de l'utilisateur)
 */
export const getPrescriptions = async () => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/prescriptions/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des ordonnances');
  }

  return response.json();
};

/**
 * Récupérer une ordonnance spécifique
 */
export const getPrescription = async (id) => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/prescriptions/${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération de l\'ordonnance');
  }

  return response.json();
};

/**
 * Créer une nouvelle ordonnance (médecin uniquement)
 */
export const createPrescription = async (prescriptionData) => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/prescriptions/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(prescriptionData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la création de l\'ordonnance');
  }

  return response.json();
};

/**
 * Modifier une ordonnance (médecin uniquement)
 */
export const updatePrescription = async (id, prescriptionData) => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/prescriptions/${id}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(prescriptionData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = { response: { data: errorData } };
    throw error;
  }

  return response.json();
};

/**
 * Supprimer une ordonnance (médecin uniquement)
 */
export const deletePrescription = async (id) => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/prescriptions/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la suppression de l\'ordonnance');
  }

  return true;
};

/**
 * Marquer une ordonnance comme récupérée en pharmacie (patient uniquement)
 */
export const markPrescriptionPickedUp = async (id) => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/prescriptions/${id}/mark_picked_up/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la mise à jour');
  }

  return response.json();
};

/**
 * Télécharger une ordonnance en PDF
 */
export const downloadPrescriptionPDF = async (id) => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/prescriptions/${id}/download_pdf/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ordonnance_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

