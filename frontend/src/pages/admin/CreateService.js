import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { getAccessToken } from '../../utils/auth';
import '../../styles/CreateService.css';

const CreateService = () => {
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'consultation',
    description: '',
    duration: 30,
    price: 0,
    is_active: true,
    clinic: ''
  });

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const SERVICE_TYPES = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'checkup', label: 'Bilan de santé' },
    { value: 'surgery', label: 'Chirurgie' },
    { value: 'therapy', label: 'Thérapie' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'dental', label: 'Dentaire' },
    { value: 'other', label: 'Autre' },
  ];

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch('http://localhost:8000/api/clinics/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, clinic: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      const response = await fetch('http://localhost:8000/api/services/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('✅ Service créé avec succès!');
        setTimeout(() => navigate('/admin/services-list'), 2000);
      } else {
        setError(data.error || data.detail || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-service-container">
      <button className="back-btn" onClick={() => navigate('/admin/services-list')}>
        <FiArrowLeft /> Retour
      </button>

      <div className="create-service-card">
        <h1>➕ Créer un Nouveau Service</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="clinic">Clinique *</label>
            <select
              id="clinic"
              name="clinic"
              value={formData.clinic}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Sélectionner une clinique</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Nom du service *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ex: Consultation Générale"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="service_type">Type de service *</label>
            <select
              id="service_type"
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              disabled={loading}
            >
              {SERVICE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description du service..."
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Durée (minutes) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="5"
                step="5"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Prix (D) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group checkbox">
            <label htmlFor="is_active">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={loading}
              />
              Service actif
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/admin/services-list')}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer le service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateService;

