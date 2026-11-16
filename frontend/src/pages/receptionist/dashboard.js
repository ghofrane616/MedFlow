import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../../styles/Dashboard.css';
import { API_URL } from '../../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    todayAppointments: 0,
    activePatients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');

      // Récupérer les rendez-vous
      const appointmentsResponse = await fetch(`${API_URL}/appointments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les patients de la clinique
      const patientsResponse = await fetch(`${API_URL}/clinic-patients/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let totalAppointments = 0;
      let confirmedAppointments = 0;
      let pendingAppointments = 0;
      let todayAppointments = 0;
      let totalPatients = 0;
      let activePatients = 0;

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        totalAppointments = Array.isArray(appointmentsData) ? appointmentsData.length : 0;
        confirmedAppointments = appointmentsData.filter(a => a.status === 'confirmed').length;
        pendingAppointments = appointmentsData.filter(a => a.status === 'scheduled').length;

        // Compter les rendez-vous d'aujourd'hui
        const today = new Date().toDateString();
        todayAppointments = appointmentsData.filter(a =>
          new Date(a.appointment_date).toDateString() === today
        ).length;
      }

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        totalPatients = patientsData.count || 0;
        activePatients = patientsData.patients ? patientsData.patients.filter(p => p.is_active).length : 0;
      }

      setStats({
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        todayAppointments,
        totalPatients,
        activePatients,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/appointments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const appointmentsList = Array.isArray(data) ? data : [];

        // Trier les rendez-vous par date la plus proche (futurs d'abord)
        const now = new Date();
        const sortedAppointments = appointmentsList
          .filter(a => new Date(a.appointment_date) >= now) // Seulement les rendez-vous futurs
          .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
          .slice(0, 5); // Prendre les 5 premiers

        setAppointments(sortedAppointments);

        // Filtrer les rendez-vous d'aujourd'hui
        const today = new Date().toDateString();
        const today_appointments = appointmentsList.filter(a =>
          new Date(a.appointment_date).toDateString() === today
        ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        setTodayAppointments(today_appointments);

        // Calculer les statistiques mensuelles pour le graphique
        calculateMonthlyStats(appointmentsList);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (appointmentsList) => {
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const now = new Date();
    const stats = [];

    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      const monthAppointments = appointmentsList.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        const aptMonthKey = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}`;
        return aptMonthKey === monthKey;
      });

      const completed = monthAppointments.filter(apt => apt.status === 'completed').length;
      const cancelled = monthAppointments.filter(apt => apt.status === 'cancelled').length;

      stats.push({
        name: monthName,
        complétés: completed,
        annulés: cancelled
      });
    }

    setMonthlyStats(stats);
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/clinic-patients/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Prendre les 5 premiers patients
        const patientsList = data.patients ? data.patients.slice(0, 5) : [];
        setPatients(patientsList);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
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

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeFormatted = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateFormatted} à ${timeFormatted}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'scheduled': { text: 'Planifié', class: 'en\ attente' },
      'confirmed': { text: 'Confirmé', class: 'confirmé' },
      'in_progress': { text: 'En cours', class: 'confirmé' },
      'completed': { text: 'Complété', class: 'complété' },
      'cancelled': { text: 'Annulé', class: 'cancelled' },
      'no_show': { text: 'Absent', class: 'cancelled' },
    };
    const statusInfo = statusMap[status] || { text: status, class: 'en\ attente' };
    return <span className={`status ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  return (
    <div className="dashboard-container">
      <h1>📞 Tableau de Bord Réceptionniste</h1>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => navigate('/appointments')}>
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Total Rendez-vous</h3>
            <p className="stat-number">{loading ? '...' : stats.totalAppointments}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/appointments')}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Confirmés</h3>
            <p className="stat-number">{loading ? '...' : stats.confirmedAppointments}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/appointments')}>
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>En Attente</h3>
            <p className="stat-number">{loading ? '...' : stats.pendingAppointments}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/appointments')}>
          <div className="stat-icon">📆</div>
          <div className="stat-content">
            <h3>Aujourd'hui</h3>
            <p className="stat-number">{loading ? '...' : stats.todayAppointments}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/receptionist/patients-list')}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Patients</h3>
            <p className="stat-number">{loading ? '...' : stats.totalPatients}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/receptionist/patients-list')}>
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <h3>Patients Actifs</h3>
            <p className="stat-number">{loading ? '...' : stats.activePatients}</p>
          </div>
        </div>
      </div>

      {/* Rendez-vous d'aujourd'hui */}
      {todayAppointments.length > 0 && (
        <div className="section section-highlight">
          <h2>📆 Rendez-vous d'Aujourd'hui</h2>
          <div className="today-appointments-table">
            <div className="today-table-header">
              <div className="today-table-col today-col-time">Heure</div>
              <div className="today-table-col today-col-patient">Patient</div>
              <div className="today-table-col today-col-doctor">Médecin</div>
              <div className="today-table-col today-col-service">Service</div>
              <div className="today-table-col today-col-status">Statut</div>
              <div className="today-table-col today-col-actions">Actions</div>
            </div>
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="today-table-row">
                <div className="today-table-col today-col-time">
                  <span className="time-badge">{formatTime(apt.appointment_date)}</span>
                </div>
                <div className="today-table-col today-col-patient">
                  <strong>{apt.patient_name || 'Patient'}</strong>
                </div>
                <div className="today-table-col today-col-doctor">
                  {apt.doctor_name || 'N/A'}
                </div>
                <div className="today-table-col today-col-service">
                  {apt.service_name || 'N/A'}
                </div>
                <div className="today-table-col today-col-status">
                  {getStatusBadge(apt.status)}
                </div>
                <div className="today-table-col today-col-actions">
                  <button
                    className="btn-small"
                    onClick={() => navigate(`/appointments/${apt.id}`)}
                    title="Voir les détails"
                  >
                    👁️
                  </button>
                  {apt.status === 'scheduled' && (
                    <button
                      className="btn-small btn-success"
                      onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendez-vous récents */}
      <div className="section">
        <h2>📅 Rendez-vous Récents</h2>
        {appointments.length > 0 ? (
          <div className="appointments-table">
            <div className="table-header">
              <div className="table-col table-col-date">Date & Heure</div>
              <div className="table-col table-col-patient">Patient</div>
              <div className="table-col table-col-doctor">Médecin</div>
              <div className="table-col table-col-service">Service</div>
              <div className="table-col table-col-status">Statut</div>
              <div className="table-col table-col-actions">Actions</div>
            </div>
            {appointments.map((apt) => (
              <div key={apt.id} className="table-row">
                <div className="table-col table-col-date">
                  <span className="date-badge">{formatDateTime(apt.appointment_date)}</span>
                </div>
                <div className="table-col table-col-patient">
                  <strong>{apt.patient_name || 'Patient'}</strong>
                </div>
                <div className="table-col table-col-doctor">
                  {apt.doctor_name || 'N/A'}
                </div>
                <div className="table-col table-col-service">
                  {apt.service_name || 'N/A'}
                </div>
                <div className="table-col table-col-status">
                  {getStatusBadge(apt.status)}
                </div>
                <div className="table-col table-col-actions">
                  <button
                    className="btn-small"
                    onClick={() => navigate(`/appointments/${apt.id}`)}
                    title="Voir les détails"
                  >
                    👁️
                  </button>
                  <button
                    className="btn-small"
                    onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">Aucun rendez-vous</p>
        )}
      </div>

      {/* Patients récents */}
      <div className="section">
        <h2>👥 Patients Récents</h2>
        <div className="patients-list">
          {patients.length > 0 ? (
            patients.map((patient) => (
              <div key={patient.id} className="patient-item">
                <div className="patient-info">
                  <h4>{patient.first_name} {patient.last_name}</h4>
                  <p>📧 Email: {patient.email}</p>
                  {patient.phone_number && <p>📱 Tél: {patient.phone_number}</p>}
                  <p>📅 Inscrit: {formatDate(patient.created_at).split(' ')[0]}</p>
                </div>
                <div className="patient-status">
                  {patient.is_active ? (
                    <span className="badge-active">✓ Actif</span>
                  ) : (
                    <span className="badge-inactive">✗ Inactif</span>
                  )}
                </div>
                <button
                  className="btn-small"
                  onClick={() => navigate(`/receptionist/patients/${patient.id}`)}
                >
                  👁️ Voir
                </button>
              </div>
            ))
          ) : (
            <p>Aucun patient</p>
          )}
        </div>
      </div>

      {/* Graphique Historique des Rendez-vous */}
      <div className="section">
        <h2>📈 Historique des Rendez-vous</h2>
        <div style={{ height: '300px' }}>
          <Bar
            data={{
              labels: monthlyStats.map(stat => stat.name),
              datasets: [
                {
                  label: 'Complétés',
                  data: monthlyStats.map(stat => stat.complétés),
                  backgroundColor: '#27ae60',
                  borderColor: '#229954',
                  borderWidth: 1
                },
                {
                  label: 'Annulés',
                  data: monthlyStats.map(stat => stat.annulés),
                  backgroundColor: '#e74c3c',
                  borderColor: '#c0392b',
                  borderWidth: 1
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1 }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="actions-section">
        <h2>⚡ Actions Rapides</h2>
        <div className="actions-grid">
          <button
            className="action-btn action-btn-primary"
            onClick={() => navigate('/appointments/new')}
          >
            ➕ Nouveau Rendez-vous
          </button>
          <button
            className="action-btn action-btn-success"
            onClick={() => navigate('/patients/new')}
          >
            👤 Enregistrer Patient
          </button>
          <button
            className="action-btn action-btn-info"
            onClick={() => navigate('/appointments')}
          >
            📞 Voir Rendez-vous
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;

