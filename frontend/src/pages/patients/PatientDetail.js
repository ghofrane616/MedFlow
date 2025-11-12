import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient, getMedicalHistory, deletePatient } from '../../api/patients';
import { getUser } from '../../utils/auth';
import '../../styles/Patients.css';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = user?.user_type === 'receptionist' || user?.user_type === 'admin';
  const canDelete = user?.user_type === 'receptionist' || user?.user_type === 'admin';

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const patientData = await getPatient(id);
      setPatient(patientData);

      // Récupérer l'historique médical
      try {
        const historyData = await getMedicalHistory(id);
        setMedicalHistory(historyData);
      } catch (err) {
        console.error('Erreur historique:', err);
      }
    } catch (err) {
      setError('Patient non trouvé');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/patients/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${patient.user_full_name} ?`)) {
      try {
        setDeleting(true);
        await deletePatient(id);
        navigate('/patients');
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return <div className="loading"><p>Chargement...</p></div>;
  }

  if (error) {
    return (
      <div className="patient-detail-container">
        <div className="alert alert-error">{error}</div>
        <button className="btn-back" onClick={() => navigate('/patients')}>
          ← Retour
        </button>
      </div>
    );
  }

  if (!patient) {
    return <div className="loading"><p>Patient non trouvé</p></div>;
  }

  return (
    <div className="patient-detail-container">
      <div className="patient-detail-header">
        <div>
          <h1>{patient.user_full_name}</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>ID: {patient.patient_id}</p>
        </div>
        <div className="patient-detail-actions">
          <button className="btn-back" onClick={() => navigate('/patients')}>
            ← Retour
          </button>
          {canEdit && (
            <button className="btn-edit-patient" onClick={handleEdit}>
              ✏️ Modifier
            </button>
          )}
          {canDelete && (
            <button
              className="btn-delete-patient"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '⏳ Suppression...' : '🗑️ Supprimer'}
            </button>
          )}
        </div>
      </div>

      <div className="patient-detail-grid">
        {/* Informations Personnelles */}
        <div className="detail-card">
          <h3>👤 Informations Personnelles</h3>
          <div className="detail-item">
            <span className="detail-label">Nom Complet:</span>
            <span className="detail-value">{patient.user_full_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{patient.user.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Genre:</span>
            <span className="detail-value">
              {patient.gender === 'M' ? 'Masculin' : patient.gender === 'F' ? 'Féminin' : 'Autre'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Groupe Sanguin:</span>
            <span className="detail-value">{patient.blood_type || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Statut:</span>
            <span className="detail-value">
              {patient.is_active ? '✅ Actif' : '❌ Inactif'}
            </span>
          </div>
        </div>

        {/* Contact d'Urgence */}
        <div className="detail-card">
          <h3>🚨 Contact d'Urgence</h3>
          <div className="detail-item">
            <span className="detail-label">Nom:</span>
            <span className="detail-value">{patient.emergency_contact_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Téléphone:</span>
            <span className="detail-value">{patient.emergency_contact_phone}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Relation:</span>
            <span className="detail-value">{patient.emergency_contact_relationship}</span>
          </div>
        </div>

        {/* Assurance */}
        <div className="detail-card">
          <h3>🏥 Assurance</h3>
          <div className="detail-item">
            <span className="detail-label">Numéro:</span>
            <span className="detail-value">{patient.insurance_number || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Fournisseur:</span>
            <span className="detail-value">{patient.insurance_provider || '-'}</span>
          </div>
        </div>

        {/* Informations Médicales */}
        {medicalHistory && (
          <>
            <div className="detail-card">
              <h3>📋 Antécédents Médicaux</h3>
              <div className="detail-item">
                <span className="detail-value">
                  {medicalHistory.medical_history || 'Aucun antécédent enregistré'}
                </span>
              </div>
            </div>

            <div className="detail-card">
              <h3>⚠️ Allergies</h3>
              <div className="detail-item">
                <span className="detail-value">
                  {medicalHistory.allergies || 'Aucune allergie enregistrée'}
                </span>
              </div>
            </div>

            <div className="detail-card">
              <h3>💊 Médicaments Actuels</h3>
              <div className="detail-item">
                <span className="detail-value">
                  {medicalHistory.current_medications || 'Aucun médicament enregistré'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Clinique */}
        <div className="detail-card">
          <h3>🏢 Clinique</h3>
          <div className="detail-item">
            <span className="detail-label">Nom:</span>
            <span className="detail-value">{patient.clinic_name}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="detail-card">
          <h3>📅 Dates</h3>
          <div className="detail-item">
            <span className="detail-label">Créé:</span>
            <span className="detail-value">
              {new Date(patient.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Modifié:</span>
            <span className="detail-value">
              {new Date(patient.updated_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

