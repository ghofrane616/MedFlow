import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiPhone, FiMail, FiCalendar } from 'react-icons/fi';
import '../../styles/PatientsList.css';

const ReceptionistPatientsList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    // Filtrer les patients selon le terme de recherche
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.user.first_name} ${patient.user.last_name}`.toLowerCase();
        const email = patient.user.email.toLowerCase();
        const phone = patient.user.phone_number.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || email.includes(search) || phone.includes(search);
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://localhost:8000/api/clinic-patients/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        setError('');
      } else {
        setError('Erreur lors de la récupération des patients');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="patients-list-container">
      <div className="patients-header">
        <button className="back-button" onClick={() => navigate('/receptionist/dashboard')}>
          <FiArrowLeft size={20} />
          Retour
        </button>
        <h1>👥 Liste des Patients</h1>
        <div className="header-stats">
          <span className="stat-badge">{filteredPatients.length} patient(s)</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Chargement des patients...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="no-data">
          <p>Aucun patient trouvé</p>
        </div>
      ) : (
        <div className="patients-grid">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="patient-card">
              <div className="patient-header">
                <div className="patient-avatar">
                  {patient.user.first_name.charAt(0)}{patient.user.last_name.charAt(0)}
                </div>
                <div className="patient-name-section">
                  <h3>{patient.user.first_name} {patient.user.last_name}</h3>
                  <p className="patient-id">ID: {patient.id}</p>
                </div>
              </div>

              <div className="patient-details">
                <div className="detail-item">
                  <FiMail className="detail-icon" />
                  <div>
                    <span className="detail-label">Email</span>
                    <p>{patient.user.email}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <FiPhone className="detail-icon" />
                  <div>
                    <span className="detail-label">Téléphone</span>
                    <p>{patient.user.phone_number}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <div>
                    <span className="detail-label">Date de naissance</span>
                    <p>{formatDate(patient.user.date_of_birth)}</p>
                  </div>
                </div>

                {patient.gender && (
                  <div className="detail-item">
                    <span className="detail-label">Genre</span>
                    <p>{patient.gender === 'M' ? 'Homme' : patient.gender === 'F' ? 'Femme' : 'N/A'}</p>
                  </div>
                )}

                {patient.blood_type && (
                  <div className="detail-item">
                    <span className="detail-label">Groupe sanguin</span>
                    <p>{patient.blood_type}</p>
                  </div>
                )}

                {patient.allergies && (
                  <div className="detail-item">
                    <span className="detail-label">Allergies</span>
                    <p>{patient.allergies}</p>
                  </div>
                )}
              </div>

              <div className="patient-actions">
                <button className="btn-view" onClick={() => navigate(`/receptionist/patients/${patient.id}`)}>
                  Voir Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceptionistPatientsList;

