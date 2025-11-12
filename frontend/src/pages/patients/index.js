import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientList from '../../components/PatientList';
import PatientForm from '../../components/PatientForm';
import { getPatients, createPatient, updatePatient, deletePatient } from '../../api/patients';
import { getUser } from '../../utils/auth';
import '../../styles/Patients.css';

export default function PatientsPage() {
  const navigate = useNavigate();
  const user = getUser();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Vérifier les permissions
  const canCreate = user?.user_type === 'receptionist' || user?.user_type === 'admin';
  const canEdit = user?.user_type === 'receptionist' || user?.user_type === 'admin';
  const canDelete = user?.user_type === 'receptionist' || user?.user_type === 'admin';

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      setError('Erreur lors du chargement des patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    navigate(`/patients/${patient.id}`);
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDeletePatient = async (patientId) => {
    try {
      setFormLoading(true);
      await deletePatient(patientId);
      setSuccessMessage('Patient supprimé avec succès');
      await fetchPatients();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression du patient');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPatient(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError(null);

      if (editingPatient) {
        await updatePatient(editingPatient.id, formData);
        setSuccessMessage('Patient modifié avec succès');
      } else {
        await createPatient(formData);
        setSuccessMessage('Patient créé avec succès');
      }

      setShowForm(false);
      setEditingPatient(null);
      await fetchPatients();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement du patient');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
  };

  return (
    <div className="patients-page">
      <div className="page-header">
        <h1>Gestion des Patients</h1>
        {canCreate && (
          <button className="btn-primary" onClick={handleCreateNew}>
            ➕ Nouveau Patient
          </button>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success">
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <p>Chargement des patients...</p>
        </div>
      ) : showForm ? (
        <PatientForm
          patient={editingPatient}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={formLoading}
        />
      ) : (
        <PatientList
          patients={patients}
          onSelectPatient={handleSelectPatient}
          onEdit={canEdit ? handleEditPatient : null}
          onDelete={canDelete ? handleDeletePatient : null}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

