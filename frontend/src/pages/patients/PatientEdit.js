import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PatientForm from '../../components/PatientForm';
import { getPatient, updatePatient } from '../../api/patients';
import '../../styles/Patients.css';

export default function PatientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatient(id);
      setPatient(data);
    } catch (err) {
      setError('Patient non trouvé');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError(null);
      await updatePatient(id, formData);
      navigate(`/patients/${id}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/patients/${id}`);
  };

  if (loading) {
    return <div className="loading"><p>Chargement...</p></div>;
  }

  if (error) {
    return (
      <div className="patient-form-container">
        <div className="alert alert-error">{error}</div>
        <button className="btn-back" onClick={() => navigate('/patients')}>
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}
      <PatientForm
        patient={patient}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={formLoading}
      />
    </div>
  );
}

