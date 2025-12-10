import { getAccessToken } from '../utils/auth';

const API_URL = 'http://localhost:8000/api';

export const getAppointments = async () => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    throw error;
  }
};

export const getAppointment = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/${id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération du rendez-vous:', error);
    throw error;
  }
};

export const getMyAppointments = async () => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/my_appointments/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération de mes rendez-vous:', error);
    throw error;
  }
};

export const createAppointment = async (data) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Extraire le message d'erreur
      let errorMessage = 'Erreur lors de la création du rendez-vous';

      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
        errorMessage = errorData.non_field_errors[0];
      } else if (typeof errorData === 'object') {
        // Chercher le premier message d'erreur
        for (const key in errorData) {
          if (Array.isArray(errorData[key]) && errorData[key].length > 0) {
            errorMessage = errorData[key][0];
            break;
          } else if (typeof errorData[key] === 'string') {
            errorMessage = errorData[key];
            break;
          }
        }
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    throw error;
  }
};

export const updateAppointment = async (id, data) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Extraire le message d'erreur
      let errorMessage = 'Erreur lors de la modification du rendez-vous';

      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
        errorMessage = errorData.non_field_errors[0];
      } else if (typeof errorData === 'object') {
        // Chercher le premier message d'erreur
        for (const key in errorData) {
          if (Array.isArray(errorData[key]) && errorData[key].length > 0) {
            errorMessage = errorData[key][0];
            break;
          } else if (typeof errorData[key] === 'string') {
            errorMessage = errorData[key];
            break;
          }
        }
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la modification du rendez-vous:', error);
    throw error;
  }
};

export const deleteAppointment = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/${id}/`, {
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
    console.error('Erreur lors de la suppression du rendez-vous:', error);
    throw error;
  }
};

export const confirmAppointment = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/${id}/confirm/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la confirmation du rendez-vous:', error);
    throw error;
  }
};

export const cancelAppointment = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/${id}/cancel/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    throw error;
  }
};

export const hideAppointmentForPatient = async (id) => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/appointments/${id}/hide_for_patient/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression du rendez-vous:', error);
    throw error;
  }
};

export const getAvailableSlots = async (doctorId, date, serviceId = null) => {
  const token = getAccessToken();
  try {
    const dateStr = date.toISOString().split('T')[0];
    let url = `${API_URL}/appointments/available_slots/?doctor_id=${doctorId}&date=${dateStr}`;

    // Ajouter le service_id si fourni
    if (serviceId) {
      url += `&service_id=${serviceId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux disponibles:', error);
    throw error;
  }
};

export const getServices = async () => {
  const token = getAccessToken();
  try {
    const response = await fetch(`${API_URL}/services/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    throw error;
  }
};

