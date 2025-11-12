import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientForm from '../../components/PatientForm';
import { createPatient } from '../../api/patients';
import '../../styles/Patients.css';

export default function PatientNew() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError(null);
      const newPatient = await createPatient(formData);
      navigate(`/patients/${newPatient.id}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/patients');
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}
      <PatientForm
        patient={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={formLoading}
      />
    </div>
  );
}

