import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentForm from '../../components/AppointmentForm';
import SuccessModal from '../../components/SuccessModal';
import AlertModal from '../../components/AlertModal';
import { createAppointment, getServices } from '../../api/appointments';
import { getAccessToken } from '../../utils/auth';
import '../../styles/Appointments.css';

export default function AppointmentNew() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAccessToken();
      const API_URL = 'http://localhost:8000/api';

      // Charger les services
      const servicesData = await getServices();
      setServices(Array.isArray(servicesData) ? servicesData : []);

      // Charger les médecins depuis l'API
      const doctorsResponse = await fetch(`${API_URL}/doctors/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } else {
        console.error('Erreur lors du chargement des médecins');
        setDoctors([]);
      }

      // Charger les patients depuis l'API
      const patientsResponse = await fetch(`${API_URL}/patients/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      } else {
        console.error('Erreur lors du chargement des patients');
        setPatients([]);
      }

      // Charger les cliniques depuis l'API
      const clinicsResponse = await fetch(`${API_URL}/clinics/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        setClinics(Array.isArray(clinicsData) ? clinicsData : []);
      } else {
        console.error('Erreur lors du chargement des cliniques');
        setClinics([]);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      setErrorMessage('');

      await createAppointment(formData);
      setShowSuccessModal(true);
    } catch (err) {
      const message = err.message || 'Erreur lors de la création du rendez-vous';
      setError(message);
      setErrorMessage(message);
      setShowErrorModal(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/appointments');
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  if (loading && doctors.length === 0) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="appointment-new">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={handleCancel}>
          ← Retour
        </button>
        <h1>Créer un Nouveau Rendez-vous</h1>
      </div>

      <div className="form-container">
        <AppointmentForm
          doctors={doctors}
          services={services}
          patients={patients}
          clinics={clinics}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
        />
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="✓ Rendez-vous créé avec succès"
        message="Le rendez-vous a été créé et vous allez être redirigé vers la liste."
        onClose={handleSuccessModalClose}
        autoCloseDelay={2000}
      />

      <AlertModal
        isOpen={showErrorModal}
        type="error"
        title="❌ Erreur"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
}

