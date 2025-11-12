import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import '../../styles/CreateClinic.css';

const CreateClinic = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    phone_number: '',
    email: '',
    website: '',
    description: '',
    opening_hours: {},
    is_active: true,
  });

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

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom de la clinique est requis');
      return;
    }
    if (!formData.address.trim()) {
      setError('L\'adresse est requise');
      return;
    }
    if (!formData.phone_number.trim()) {
      setError('Le numéro de téléphone est requis');
      return;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      console.log('Token:', token);
      console.log('Form data:', formData);

      if (!token) {
        setError('Erreur: Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      const response = await fetch('http://localhost:8000/api/clinics/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        setSuccess('✅ Clinique créée avec succès!');
        setTimeout(() => {
          navigate('/admin/clinics-list');
        }, 1500);
      } else {
        const data = await response.json();
        console.log('Error response:', data);
        setError(data.detail || 'Erreur lors de la création de la clinique');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-clinic-container">
      <div className="create-clinic-header">
        <button className="back-btn" onClick={() => navigate('/admin/clinics-list')}>
          <FiArrowLeft /> Retour
        </button>
        <h1>🏥 Ajouter une Nouvelle Clinique</h1>
      </div>

      <div className="create-clinic-form">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom de la Clinique *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Clinique Santé Plus"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Adresse *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ex: 123 Rue de la Paix"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Ville</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ex: Casablanca"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="postal_code">Code Postal</label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="Ex: 20000"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Pays</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Ex: Maroc"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone_number">Téléphone *</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Ex: +212 5 22 12 34 56"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ex: contact@clinique.com"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="website">Site Web</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://www.clinique.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Entrez une description de la clinique"
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="is_active">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_active: e.target.checked
                }))}
                disabled={loading}
              />
              Clinique Active
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/clinics-list')}
              disabled={loading}
            >
              ❌ Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Création...' : '✅ Créer Clinique'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClinic;

