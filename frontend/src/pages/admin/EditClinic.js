import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import '../../styles/EditClinic.css';

const EditClinic = () => {
  const navigate = useNavigate();
  const { clinicId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    is_active: true
  });

  const fetchClinic = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      console.log('Fetching clinic with ID:', clinicId);
      const url = `http://localhost:8000/api/clinics/${clinicId}/`;
      console.log('URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Clinic data:', data);
        setFormData({
          name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          country: data.country || '',
          phone_number: data.phone_number || '',
          email: data.email || '',
          website: data.website || '',
          description: data.description || '',
          opening_hours: data.opening_hours || {},
          is_active: data.is_active !== undefined ? data.is_active : true
        });
        setError('');
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        setError('Erreur lors de la récupération de la clinique');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Le nom de la clinique est obligatoire');
      return;
    }

    if (!formData.address.trim()) {
      setError('L\'adresse est obligatoire');
      return;
    }

    if (!formData.phone_number.trim()) {
      setError('Le numéro de téléphone est obligatoire');
      return;
    }

    if (!formData.email.trim()) {
      setError('L\'email est obligatoire');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('access_token');

      console.log('Submitting clinic with ID:', clinicId);
      console.log('Form data:', formData);

      const url = `http://localhost:8000/api/clinics/${clinicId}/`;
      console.log('PUT URL:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('PUT Response status:', response.status);

      if (response.ok) {
        setSuccess('Clinique modifiée avec succès !');
        setError('');
        setTimeout(() => {
          navigate('/admin/clinics-list');
        }, 1500);
      } else {
        const errorData = await response.json();
        console.log('PUT Error response:', errorData);
        setError(errorData.detail || 'Erreur lors de la modification');
      }
    } catch (err) {
      console.error('PUT Error:', err);
      setError('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-clinic-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="edit-clinic-container">
      <button className="back-btn" onClick={() => navigate('/admin/clinics-list')}>
        <FiArrowLeft /> Retour
      </button>

      <div className="edit-clinic-card">
        <h1>✏️ Modifier la Clinique</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="edit-clinic-form">
          <div className="form-group">
            <label htmlFor="name">Nom de la Clinique *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Clinique Santé Plus"
              required
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
              required
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
                required
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
                required
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Entrez la description"
              rows="4"
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
              />
              Clinique Active
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/admin/clinics-list')}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={saving}
            >
              <FiSave /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClinic;

