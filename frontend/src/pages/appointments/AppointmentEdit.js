import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppointmentForm from '../../components/AppointmentForm';
import SuccessModal from '../../components/SuccessModal';
import AlertModal from '../../components/AlertModal';
import {
  getAppointment,
  updateAppointment,
  getServices
} from '../../api/appointments';
import { getPatients } from '../../api/patients';
import { getAccessToken } from '../../utils/auth';
import '../../styles/Appointments.css';

export default function AppointmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAccessToken();
      const API_URL = 'http://localhost:8000/api';

      // Charger le rendez-vous
      const appointmentData = await getAppointment(id);
      setAppointment(appointmentData);

      // Charger les services
      const servicesData = await getServices();
      setServices(Array.isArray(servicesData) ? servicesData : []);

      // Charger les patients
      const patientsData = await getPatients();
      setPatients(Array.isArray(patientsData) ? patientsData : []);

      // Charger les médecins
      const doctorsResponse = await fetch(`${API_URL}/doctors/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      }

      // Charger les cliniques
      const clinicsResponse = await fetch(`${API_URL}/clinics/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        setClinics(Array.isArray(clinicsData) ? clinicsData : []);
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

      await updateAppointment(id, formData);
      setShowSuccessModal(true);
    } catch (err) {
      const message = err.message || 'Erreur lors de la modification du rendez-vous';
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
    navigate(`/appointments/${id}`);
  };

  const handleCancel = () => {
    navigate(`/appointments/${id}`);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error && !appointment) {
    return (
      <div className="error-container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="appointment-edit">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={handleCancel}>
          ← Retour
        </button>
        <h1>Modifier le Rendez-vous</h1>
      </div>

      <div className="form-container">
        {appointment && (
          <AppointmentForm
            appointment={appointment}
            doctors={doctors}
            services={services}
            patients={patients}
            clinics={clinics}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
          />
        )}
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Rendez-vous modifié avec succès"
        message="Le rendez-vous a été modifié et vous allez être redirigé vers les détails."
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

