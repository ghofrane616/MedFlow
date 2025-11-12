import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiTrash2, FiEdit2, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import '../../styles/ClinicsList.css';

const ClinicsList = () => {
  const navigate = useNavigate();
  const [clinics, setClinic] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      console.log('Token:', token);
      console.log('Fetching clinics from: http://localhost:8000/api/clinics/');

      if (!token) {
        setError('Erreur: Token d\'authentification manquant. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/clinics/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Clinics data:', data);
        const clinicsArray = Array.isArray(data) ? data : [];
        setClinic(clinicsArray);
        setFilteredClinics(clinicsArray);
        setError('');
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        setError(errorData.detail || 'Erreur lors de la récupération des cliniques');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = clinics.filter(clinic => 
      clinic.name.toLowerCase().includes(term) ||
      (clinic.address && clinic.address.toLowerCase().includes(term)) ||
      (clinic.phone && clinic.phone.toLowerCase().includes(term))
    );
    
    setFilteredClinics(filtered);
  };

  const handleDelete = async (clinicId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette clinique ?')) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/clinics/${clinicId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setClinic(clinics.filter(c => c.id !== clinicId));
          setFilteredClinics(filteredClinics.filter(c => c.id !== clinicId));
        } else {
          alert('Erreur lors de la suppression');
        }
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  };

  return (
    <div className="clinics-list-container">
      <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
        <FiArrowLeft /> Retour
      </button>

      <div className="clinics-list-card">
        <h1>🏥 Gestion des Cliniques</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filters-section">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, adresse, téléphone..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Chargement...</div>
        ) : filteredClinics.length === 0 ? (
          <div className="no-clinics">Aucune clinique trouvée</div>
        ) : (
          <div className="clinics-grid">
            {filteredClinics.map(clinic => (
              <div key={clinic.id} className="clinic-card">
                <div className="clinic-header">
                  <h3>🏥 {clinic.name}</h3>
                  <div className="clinic-actions">
                    <button
                      className="action-btn edit-btn"
                      title="Modifier"
                      onClick={() => navigate(`/admin/edit-clinic/${clinic.id}`)}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      title="Supprimer"
                      onClick={() => handleDelete(clinic.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className="clinic-details">
                  {clinic.address && (
                    <div className="detail-item">
                      <FiMapPin className="detail-icon" />
                      <span>{clinic.address}</span>
                    </div>
                  )}
                  
                  {clinic.phone && (
                    <div className="detail-item">
                      <FiPhone className="detail-icon" />
                      <span>{clinic.phone}</span>
                    </div>
                  )}
                  
                  {clinic.email && (
                    <div className="detail-item">
                      <FiMail className="detail-icon" />
                      <span>{clinic.email}</span>
                    </div>
                  )}
                </div>

                {clinic.description && (
                  <div className="clinic-description">
                    {clinic.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="clinics-footer">
          <p>Total: <strong>{filteredClinics.length}</strong> clinique(s)</p>
          <button className="create-btn" onClick={() => navigate('/admin/create-clinic')}>
            ➕ Créer une nouvelle clinique
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicsList;

