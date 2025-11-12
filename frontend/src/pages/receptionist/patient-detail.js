import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiMail, FiCalendar, FiMapPin, FiDroplet, FiAlertCircle } from 'react-icons/fi';
import '../../styles/PatientDetail.css';

const ReceptionistPatientDetail = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatientDetail();
  }, [patientId]);

  const fetchPatientDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`http://localhost:8000/api/patients/${patientId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPatient(data);
        setError('');
      } else if (response.status === 404) {
        setError('Patient non trouvé');
      } else {
        setError('Erreur lors de la récupération des détails du patient');
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

  if (loading) {
    return (
      <div className="patient-detail-container">
        <div className="loading">Chargement des détails du patient...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-detail-container">
        <button className="back-button" onClick={() => navigate('/receptionist/patients-list')}>
          <FiArrowLeft size={20} />
          Retour
        </button>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-detail-container">
        <button className="back-button" onClick={() => navigate('/receptionist/patients-list')}>
          <FiArrowLeft size={20} />
          Retour
        </button>
        <div className="no-data">Patient non trouvé</div>
      </div>
    );
  }

  return (
    <div className="patient-detail-container">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/receptionist/patients-list')}>
          <FiArrowLeft size={20} />
          Retour
        </button>
        <h1>👤 Détails du Patient</h1>
      </div>

      <div className="detail-content">
        {/* Section Informations Personnelles */}
        <div className="detail-section">
          <h2>📋 Informations Personnelles</h2>
          <div className="section-content">
            <div className="patient-header-detail">
              <div className="patient-avatar-large">
                {patient.user.first_name.charAt(0)}{patient.user.last_name.charAt(0)}
              </div>
              <div className="patient-info">
                <h3>{patient.user.first_name} {patient.user.last_name}</h3>
                <p className="patient-id">ID Patient: {patient.id}</p>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <FiMail className="info-icon" />
                <div>
                  <span className="info-label">Email</span>
                  <p>{patient.user.email}</p>
                </div>
              </div>

              <div className="info-item">
                <FiPhone className="info-icon" />
                <div>
                  <span className="info-label">Téléphone</span>
                  <p>{patient.user.phone_number}</p>
                </div>
              </div>

              <div className="info-item">
                <FiCalendar className="info-icon" />
                <div>
                  <span className="info-label">Date de Naissance</span>
                  <p>{formatDate(patient.user.date_of_birth)}</p>
                </div>
              </div>

              <div className="info-item">
                <FiMapPin className="info-icon" />
                <div>
                  <span className="info-label">Adresse</span>
                  <p>{patient.user.address || 'Non renseignée'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Informations Médicales */}
        <div className="detail-section">
          <h2>🏥 Informations Médicales</h2>
          <div className="section-content">
            <div className="medical-grid">
              <div className="medical-item">
                <span className="medical-label">Genre</span>
                <p>{patient.gender === 'M' ? 'Homme' : patient.gender === 'F' ? 'Femme' : 'N/A'}</p>
              </div>

              <div className="medical-item">
                <FiDroplet className="medical-icon" />
                <span className="medical-label">Groupe Sanguin</span>
                <p>{patient.blood_type || 'Non renseigné'}</p>
              </div>

              <div className="medical-item">
                <span className="medical-label">Contact d'Urgence</span>
                <p>{patient.emergency_contact || 'Non renseigné'}</p>
              </div>
            </div>

            {patient.allergies && (
              <div className="alert-box">
                <FiAlertCircle className="alert-icon" />
                <div>
                  <strong>⚠️ Allergies</strong>
                  <p>{patient.allergies}</p>
                </div>
              </div>
            )}

            {patient.medical_history && (
              <div className="history-box">
                <strong>📖 Historique Médical</strong>
                <p>{patient.medical_history}</p>
              </div>
            )}

            {patient.medications && (
              <div className="medications-box">
                <strong>💊 Médicaments</strong>
                <p>{patient.medications}</p>
              </div>
            )}

            {patient.insurance && (
              <div className="insurance-box">
                <strong>🛡️ Assurance</strong>
                <p>{patient.insurance}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section Clinique */}
        {patient.clinic && (
          <div className="detail-section">
            <h2>🏢 Clinique</h2>
            <div className="section-content">
              <div className="clinic-info">
                <h4>{patient.clinic.name}</h4>
                <p>{patient.clinic.address}</p>
                <p>{patient.clinic.phone}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionistPatientDetail;

