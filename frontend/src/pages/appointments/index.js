import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../utils/auth';
import AlertModal from '../../components/AlertModal';
import {
  getAppointments,
  getMyAppointments,
  cancelAppointment,
  deleteAppointment,
  hideAppointmentForPatient
} from '../../api/appointments';
import '../../styles/Appointments.css';

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'cancel' ou 'delete'

  const canCreate = user?.user_type === 'patient' || user?.user_type === 'receptionist';
  const canEdit = user?.user_type === 'receptionist' || user?.user_type === 'doctor';
  const canDelete = user?.user_type === 'receptionist' || user?.user_type === 'patient' || user?.user_type === 'doctor';

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (user?.user_type === 'patient') {
        data = await getMyAppointments();
      } else {
        data = await getAppointments();
      }

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erreur lors du chargement des rendez-vous');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (id) => {
    setModalConfig({
      type: 'confirm',
      title: '⚠️ Êtes-vous sûr ?',
      message: 'Vous êtes sur le point d\'annuler ce rendez-vous. Cette action ne peut pas être annulée.'
    });
    setPendingCancelId(id);
    setActionType('cancel');
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    let message = '';

    if (user?.user_type === 'patient') {
      message = 'Êtes-vous sûr de vouloir supprimer ce rendez-vous annulé de votre liste ? Il restera visible pour le médecin et la réceptionniste.';
    } else if (user?.user_type === 'doctor') {
      message = 'Êtes-vous sûr de vouloir supprimer ce rendez-vous annulé de votre liste ? Il restera visible pour le patient et la réceptionniste.';
    } else if (user?.user_type === 'receptionist') {
      message = 'Êtes-vous sûr de vouloir supprimer ce rendez-vous annulé de votre liste ? Il restera visible pour le patient et le médecin.';
    } else {
      message = 'Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous annulé ? Cette action est irréversible.';
    }

    setModalConfig({
      type: 'confirm',
      title: '🗑️ Supprimer le rendez-vous ?',
      message: message
    });
    setPendingDeleteId(id);
    setActionType('delete');
    setShowModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!pendingCancelId) return;

    try {
      setLoading(true);
      const updated = await cancelAppointment(pendingCancelId);
      setAppointments(
        appointments.map((apt) => (apt.id === pendingCancelId ? updated : apt))
      );
      setModalConfig({
        type: 'success',
        title: ' Rendez-vous annulé',
        message: 'Le rendez-vous a été annulé avec succès.'
      });
      setShowModal(true);
      setPendingCancelId(null);
      setActionType(null);
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

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;

    try {
      setLoading(true);

      // Tous les rôles utilisent deleteAppointment qui fait un soft delete selon le rôle
      // Sauf l'admin qui fait un hard delete
      if (user?.user_type === 'patient') {
        await hideAppointmentForPatient(pendingDeleteId);
      } else {
        // Pour doctor, receptionist, admin
        await deleteAppointment(pendingDeleteId);
      }

      setAppointments(
        appointments.filter((apt) => apt.id !== pendingDeleteId)
      );

      let successMessage = '';
      if (user?.user_type === 'admin') {
        successMessage = 'Le rendez-vous a été supprimé définitivement avec succès.';
      } else {
        successMessage = 'Le rendez-vous a été supprimé de votre liste avec succès.';
      }

      setModalConfig({
        type: 'success',
        title: ' Rendez-vous supprimé',
        message: successMessage
      });
      setShowModal(true);
      setPendingDeleteId(null);
      setActionType(null);
    } catch (err) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: err.message || 'Une erreur s\'est produite lors de la suppression du rendez-vous.'
      });
      setShowModal(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setPendingCancelId(null);
    setPendingDeleteId(null);
    setActionType(null);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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
    return <div className="loading">Chargement des rendez-vous...</div>;
  }

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>📅 Gestion des Rendez-vous</h1>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/appointments/new')}
          >
            ➕ Nouveau Rendez-vous
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="appointments-filters">
        <input
          type="text"
          placeholder="Rechercher par patient, médecin ou raison..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="scheduled">Planifié</option>
          <option value="confirmed">Confirmé</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Complété</option>
          <option value="cancelled">Annulé</option>
          <option value="no_show">Absent</option>
        </select>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <p>Aucun rendez-vous trouvé</p>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <div className="appointment-header">
                <h3>{apt.patient_name}</h3>
                {getStatusBadge(apt.status)}
              </div>

              <div className="appointment-details">
                <p>
                  <strong>Médecin:</strong> {apt.doctor_name}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(apt.appointment_date)}
                </p>
                <p>
                  <strong>Durée:</strong> {apt.duration} minutes
                </p>
                {apt.service_name && (
                  <p>
                    <strong>Service:</strong> {apt.service_name}
                  </p>
                )}
                {apt.reason && (
                  <p>
                    <strong>Raison:</strong> {apt.reason}
                  </p>
                )}
              </div>

              <div className="appointment-actions">
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => navigate(`/appointments/${apt.id}`)}
                >
                  👁️ Voir
                </button>

                {canEdit && apt.status === 'scheduled' && (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                  >
                    ✏️ Modifier
                  </button>
                )}

                {(canDelete || (user?.user_type === 'patient' && apt.status !== 'completed')) && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleCancelClick(apt.id)}
                  >
                    ❌ Annuler
                  </button>
                )}

                {canDelete && apt.status === 'cancelled' && (
                  <button
                    className="btn btn-sm btn-dark"
                    onClick={() => handleDeleteClick(apt.id)}
                  >
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertModal
        isOpen={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={handleModalClose}
        onConfirm={
          actionType === 'cancel' ? handleCancelConfirm :
          actionType === 'delete' ? handleDeleteConfirm :
          undefined
        }
        onCancel={handleModalClose}
        confirmText={
          actionType === 'cancel' ? 'Annuler le rendez-vous' :
          actionType === 'delete' ? 'Supprimer' :
          'OK'
        }
        cancelText={
          actionType === 'cancel' ? 'Garder le rendez-vous' :
          actionType === 'delete' ? 'Annuler' :
          'OK'
        }
        closeText="OK"
      />
    </div>
  );
}

