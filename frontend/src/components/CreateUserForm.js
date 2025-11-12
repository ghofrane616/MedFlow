import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../utils/auth';

const CreateUserForm = ({ onUserCreated }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    user_type: 'receptionist',
    clinic: '',
    specialization: '',
    license_number: '',
    years_of_experience: 0,
  });

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch('http://localhost:8000/api/clinics/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des cliniques:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = getAccessToken();

      // Créer l'utilisateur
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_type: formData.user_type,
      };

      const userResponse = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const userData_response = await userResponse.json();
      const userId = userData_response.user.id;

      // Créer le profil selon le type
      if (formData.user_type === 'receptionist') {
        await createReceptionist(userId, token);
      } else if (formData.user_type === 'doctor') {
        await createDoctor(userId, token);
      }

      setSuccess(`✅ ${formData.user_type === 'receptionist' ? 'Réceptionniste' : formData.user_type === 'doctor' ? 'Médecin' : 'Admin'} créé avec succès !`);
      
      // Réinitialiser le formulaire
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        user_type: 'receptionist',
        clinic: '',
        specialization: '',
        license_number: '',
        years_of_experience: 0,
      });

      if (onUserCreated) onUserCreated();
    } catch (err) {
      setError(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createReceptionist = async (userId, token) => {
    const response = await fetch('http://localhost:8000/api/receptionists/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: userId,
        clinic: formData.clinic,
        employee_id: `REC-${userId}`,
        shift_start: '08:00:00',
        shift_end: '17:00:00',
        working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        permissions: {}
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création du profil réceptionniste');
    }
  };

  const createDoctor = async (userId, token) => {
    const response = await fetch('http://localhost:8000/api/doctors/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: userId,
        clinic: formData.clinic,
        doctor_id: `DOC-${userId}`,
        specialization: formData.specialization,
        license_number: formData.license_number,
        years_of_experience: parseInt(formData.years_of_experience),
        education: 'À compléter',
        consultation_fee: 50.00,
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        available_hours: {}
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erreur lors de la création du profil médecin');
    }
  };

  return (
    <div className="create-user-form">
      <h2>➕ Créer un Nouveau Compte</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Prénom <span className="required">*</span></label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Nom <span className="required">*</span></label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nom d'utilisateur <span className="required">*</span></label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mot de passe <span className="required">*</span></label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Confirmer le mot de passe <span className="required">*</span></label>
            <input
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type de compte <span className="required">*</span></label>
            <select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="receptionist">Réceptionniste</option>
              <option value="doctor">Médecin</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div className="form-group">
            <label>Clinique <span className="required">*</span></label>
            <select
              name="clinic"
              value={formData.clinic}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Sélectionner une clinique --</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.user_type === 'doctor' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Spécialisation <span className="required">*</span></label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="Ex: Cardiologie"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Numéro de licence <span className="required">*</span></label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="Ex: LIC-001"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Années d'expérience</label>
              <input
                type="number"
                name="years_of_experience"
                value={formData.years_of_experience}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>
          </>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '⏳ Création en cours...' : '✅ Créer le compte'}
        </button>
      </form>
    </div>
  );
};

export default CreateUserForm;

