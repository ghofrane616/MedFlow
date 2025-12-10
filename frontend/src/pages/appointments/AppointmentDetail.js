import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../../utils/auth';
import AlertModal from '../../components/AlertModal';
import {
  getAppointment,
  confirmAppointment,
  cancelAppointment
} from '../../api/appointments';
import '../../styles/Appointments.css';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppointment(id);
      setAppointment(data);
    } catch (err) {
      setError('Erreur lors du chargement du rendez-vous');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const updated = await confirmAppointment(id);
      setAppointment(updated);
      setModalConfig({
        type: 'success',
        title: ' Rendez-vous confirmé',
        message: 'Le rendez-vous a été confirmé avec succès. Un rappel sera envoyé au patient.'
      });
      setShowModal(true);
    } catch (err) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Une erreur s\'est produite lors de la confirmation du rendez-vous.'
      });
      setShowModal(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setModalConfig({
      type: 'confirm',
      title: '⚠️ Êtes-vous sûr ?',
      message: 'Vous êtes sur le point d\'annuler ce rendez-vous. Cette action ne peut pas être annulée.'
    });
    setPendingAction('cancel');
    setShowModal(true);
  };

  const handleCancelConfirm = async () => {
    try {
      setLoading(true);
      const updated = await cancelAppointment(id);
      setAppointment(updated);
      setModalConfig({
        type: 'success',
        title: 'Rendez-vous annulé',
        message: 'Le rendez-vous a été annulé. Un email de notification a été envoyé au patient.'
      });
      setShowModal(true);
      setPendingAction(null);
    } catch (err) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Une erreur s\'est produite lors de l\'annulation du rendez-vous.'
      });
      setShowModal(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setPendingAction(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { label: 'Planifié', color: 'blue' },
      confirmed: { label: 'Confirmé', color: 'green' },
      in_progress: { label: 'En cours', color: 'orange' },
      completed: { label: 'Complété', color: 'gray' },
      cancelled: { label: 'Annulé', color: 'red' },
      no_show: { label: 'Absent', color: 'red' }
    };

    const statusInfo = statusMap[status] || { label: status, color: 'gray' };
    return (
      <span className={`badge badge-${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Chargement du rendez-vous...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
          Retour à la liste
        </button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="error-container">
        <div className="alert alert-error">Rendez-vous non trouvé</div>
        <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="appointment-detail">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/appointments')}>
          ← Retour
        </button>
        <h1>Détails du Rendez-vous</h1>
      </div>

      <div className="detail-card">
        <div className="detail-header">
          <h2>{appointment.patient_name}</h2>
          {getStatusBadge(appointment.status)}
        </div>

        <div className="detail-section">
          <h3>Informations Générales</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Médecin</label>
              <p>{appointment.doctor_name}</p>
            </div>
            <div className="detail-item">
              <label>Clinique</label>
              <p>{appointment.clinic_name}</p>
            </div>
            <div className="detail-item">
              <label>Date et Heure</label>
              <p>{formatDate(appointment.appointment_date)}</p>
            </div>
            <div className="detail-item">
              <label>Durée</label>
              <p>{appointment.duration} minutes</p>
            </div>
          </div>
        </div>

        {appointment.service_name && (
          <div className="detail-section">
            <h3>Service</h3>
            <p>{appointment.service_name}</p>
          </div>
        )}

        {appointment.reason && (
          <div className="detail-section">
            <h3>Raison de la Visite</h3>
            <p>{appointment.reason}</p>
          </div>
        )}

        {appointment.notes && (
          <div className="detail-section">
            <h3>Notes</h3>
            <p>{appointment.notes}</p>
          </div>
        )}

        <div className="detail-section">
          <h3>Informations Supplémentaires</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Rappel Envoyé</label>
              <p>{appointment.reminder_sent ? 'Oui' : 'Non'}</p>
            </div>
            <div className="detail-item">
              <label>Créé le</label>
              <p>{formatDate(appointment.created_at)}</p>
            </div>
            <div className="detail-item">
              <label>Modifié le</label>
              <p>{formatDate(appointment.updated_at)}</p>
            </div>
          </div>
        </div>

        <div className="detail-actions">
          {user?.user_type === 'receptionist' && appointment.status === 'scheduled' && (
            <button className="btn btn-success" onClick={handleConfirm}>
              Confirmer
            </button>
          )}

          {(user?.user_type === 'receptionist' || user?.user_type === 'patient') &&
            appointment.status !== 'completed' &&
            appointment.status !== 'cancelled' && (
              <button className="btn btn-danger" onClick={handleCancelClick}>
                ❌ Annuler
              </button>
            )}

          {user?.user_type === 'receptionist' && appointment.status === 'scheduled' && (
            <button
              className="btn btn-warning"
              onClick={() => navigate(`/appointments/${id}/edit`)}
            >
              ✏️ Modifier
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => navigate('/appointments')}>
            Retour à la liste
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={handleModalClose}
        onConfirm={pendingAction === 'cancel' ? handleCancelConfirm : undefined}
        onCancel={handleModalClose}
        confirmText="Annuler le rendez-vous"
        cancelText="Garder le rendez-vous"
        closeText="OK"
      />
    </div>
  );
}

