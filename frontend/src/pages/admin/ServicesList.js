import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { getAccessToken } from '../../utils/auth';
import '../../styles/ServicesList.css';

const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState('');
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
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await fetch('http://localhost:8000/api/services/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data);
        setError('');
      } else {
        setError('Erreur lors de la récupération des services');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      return;
    }

    try {
      const token = getAccessToken();
      const response = await fetch(`http://localhost:8000/api/services/${serviceId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('✅ Service supprimé avec succès');
        fetchServices();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const filteredServices = filterType
    ? services.filter(s => s.service_type === filterType)
    : services;

  const getServiceTypeLabel = (type) => {
    const found = SERVICE_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="services-list-container">
      <div className="services-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <FiArrowLeft /> Retour
        </button>
        <h1>📋 Gestion des Services</h1>
        <button
          className="create-btn"
          onClick={() => navigate('/admin/services/create')}
        >
          <FiPlus /> Nouveau Service
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="services-filters">
        <label>Filtrer par type:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les types</option>
          {SERVICE_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : filteredServices.length === 0 ? (
        <div className="empty-state">
          <p>Aucun service trouvé</p>
          <button
            className="create-btn"
            onClick={() => navigate('/admin/services/create')}
          >
            <FiPlus /> Créer le premier service
          </button>
        </div>
      ) : (
        <div className="services-table-container">
          <table className="services-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Durée</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => (
                <tr key={service.id}>
                  <td className="service-name">{service.name}</td>
                  <td>{getServiceTypeLabel(service.service_type)}</td>
                  <td>{service.duration} min</td>
                  <td>{service.price}D</td>
                  <td>
                    <span className={`status-badge ${service.is_active ? 'active' : 'inactive'}`}>
                      {service.is_active ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => navigate(`/admin/services/${service.id}/edit`)}
                      title="Éditer"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(service.id)}
                      title="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ServicesList;

