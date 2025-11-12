import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments } from '../../api/appointments';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0,
    totalPatients: 0,
    weekTotal: 0,
    monthCompleted: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const appointmentsData = await getMyAppointments();
      setAppointments(appointmentsData);

      calculateStats(appointmentsData);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayApts = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      });
      setTodayAppointments(todayApts);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingApts = appointmentsData
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= tomorrow && aptDate <= nextWeek && apt.status !== 'cancelled';
        })
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
        .slice(0, 5);
      setUpcomingAppointments(upcomingApts);

      const completedApts = appointmentsData
        .filter(apt => apt.status === 'completed')
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
        .slice(0, 5);

      const patients = completedApts.map(apt => ({
        id: apt.patient_id,
        name: apt.patient_name,
        lastVisit: apt.appointment_date,
        service: apt.service_name,
        reason: apt.reason
      }));
      setRecentPatients(patients);

      calculateMonthlyStats(appointmentsData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayApts = appointmentsData.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= today && aptDate < tomorrow;
    });

    const todayCompleted = todayApts.filter(apt => apt.status === 'completed').length;
    const todayPending = todayApts.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekApts = appointmentsData.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= weekStart && aptDate < weekEnd;
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthCompleted = appointmentsData.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= monthStart && aptDate <= monthEnd && apt.status === 'completed';
    }).length;

    const uniquePatients = new Set(appointmentsData.map(apt => apt.patient_id));

    setStats({
      todayTotal: todayApts.length,
      todayCompleted,
      todayPending,
      totalPatients: uniquePatients.size,
      weekTotal: weekApts.length,
      monthCompleted
    });
  };

  const calculateMonthlyStats = (appointmentsData) => {
    const months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthApts = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });

      const completed = monthApts.filter(apt => apt.status === 'completed').length;
      const cancelled = monthApts.filter(apt => apt.status === 'cancelled').length;

      months.push({
        name: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
        complétés: completed,
        annulés: cancelled,
        total: monthApts.length
      });
    }

    setMonthlyStats(months);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'scheduled': { label: 'Programmé', class: 'status-scheduled' },
      'confirmed': { label: 'Confirmé', class: 'status-confirmed' },
      'completed': { label: 'Complété', class: 'status-completed' },
      'cancelled': { label: 'Annulé', class: 'status-cancelled' },
      'no_show': { label: 'Absent', class: 'status-no-show' }
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const getTimelinePosition = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = (hours - 8) * 60 + minutes; // 8h = début
    const maxMinutes = 10 * 60; // 10 heures (8h-18h)
    const percentage = (totalMinutes / maxMinutes) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Chargement du dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>👨‍⚕️ Tableau de Bord Médecin</h1>
        <p className="dashboard-subtitle">Bienvenue ! Voici un aperçu de votre activité</p>
      </div>

      {/* Statistiques KPI */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Aujourd'hui</h3>
            <div className="stat-number">{stats.todayTotal}</div>
            <p className="stat-label">Rendez-vous</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Complétés</h3>
            <div className="stat-number">{stats.todayCompleted}</div>
            <p className="stat-label">Aujourd'hui</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>En Attente</h3>
            <div className="stat-number">{stats.todayPending}</div>
            <p className="stat-label">À traiter</p>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Patients</h3>
            <div className="stat-number">{stats.totalPatients}</div>
            <p className="stat-label">Total</p>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Cette Semaine</h3>
            <div className="stat-number">{stats.weekTotal}</div>
            <p className="stat-label">Rendez-vous</p>
          </div>
        </div>

        <div className="stat-card stat-teal">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Ce Mois</h3>
            <div className="stat-number">{stats.monthCompleted}</div>
            <p className="stat-label">Complétés</p>
          </div>
        </div>
      </div>

      {/* Planning d'aujourd'hui */}
      <div className="section section-highlight">
        <div className="section-header">
          <h2>� Planning d'Aujourd'hui</h2>
          <span className="badge-count">{todayAppointments.length} rendez-vous</span>
        </div>

        {todayAppointments.length > 0 ? (
          <div className="timeline-container">
            <div className="timeline-hours">
              <div className="timeline-hour">8h</div>
              <div className="timeline-hour">9h</div>
              <div className="timeline-hour">10h</div>
              <div className="timeline-hour">11h</div>
              <div className="timeline-hour">12h</div>
              <div className="timeline-hour">13h</div>
              <div className="timeline-hour">14h</div>
              <div className="timeline-hour">15h</div>
              <div className="timeline-hour">16h</div>
              <div className="timeline-hour">17h</div>
              <div className="timeline-hour">18h</div>
            </div>
            <div className="timeline-appointments">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="timeline-appointment"
                  style={{ left: `${getTimelinePosition(apt.appointment_date)}%` }}
                >
                  <div className="appointment-card-timeline">
                    <div className="appointment-time-badge">
                      {formatTime(apt.appointment_date)}
                    </div>
                    {getStatusBadge(apt.status)}
                    <div className="appointment-patient-name">
                      <strong>{apt.patient_name}</strong>
                    </div>
                    <div className="appointment-details">
                      <span className="appointment-service">🏥 {apt.service_name}</span>
                      {apt.reason && (
                        <p className="appointment-reason">📋 {apt.reason}</p>
                      )}
                    </div>
                    <button
                      className="btn-view"
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                    >
                      👁️ Voir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>🎉 Aucun rendez-vous aujourd'hui</p>
          </div>
        )}
      </div>

      {/* Prochains Rendez-vous */}
      <div className="section">
        <div className="section-header">
          <h2>📆 Prochains Rendez-vous</h2>
          <button className="btn-link" onClick={() => navigate('/appointments')}>Voir tous →</button>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="appointments-grid">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="appointment-card-modern">
                <div className="appointment-header">
                  <div className="appointment-date-badge">
                    <div className="date-day">{new Date(apt.appointment_date).getDate()}</div>
                    <div className="date-month">{new Date(apt.appointment_date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                  </div>
                  <div className="appointment-info-main">
                    <h4>{apt.patient_name}</h4>
                    <p className="appointment-time-text">🕐 {formatTime(apt.appointment_date)}</p>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
                <div className="appointment-body">
                  <div className="appointment-detail-item">
                    <span className="detail-icon">🏥</span>
                    <span>{apt.service_name}</span>
                  </div>
                  {apt.reason && (
                    <div className="appointment-detail-item">
                      <span className="detail-icon">📋</span>
                      <span>{apt.reason}</span>
                    </div>
                  )}
                </div>
                <div className="appointment-actions">
                  <button className="btn-small btn-primary" onClick={() => navigate(`/appointments/${apt.id}`)}>Voir Détails</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">Aucun rendez-vous à venir dans les 7 prochains jours</p>
        )}
      </div>

      {/* Patients Récents */}
      <div className="section">
        <div className="section-header">
          <h2>👥 Patients Récents</h2>
          <button className="btn-link" onClick={() => navigate('/patients')}>Voir tous →</button>
        </div>

        {recentPatients.length > 0 ? (
          <div className="patients-grid">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="patient-card-modern">
                <div className="patient-avatar">{patient.name?.charAt(0) || 'P'}</div>
                <div className="patient-info-main">
                  <h4>{patient.name}</h4>
                  <p className="patient-last-visit">Dernière visite: {formatDate(patient.lastVisit)}</p>
                  <p className="patient-service"><span className="service-badge">{patient.service}</span></p>
                  {patient.reason && <p className="patient-reason">Motif: {patient.reason}</p>}
                </div>
                <button className="btn-small btn-outline" onClick={() => navigate(`/patients/${patient.id}`)}>📋 Dossier</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">Aucun patient récent</p>
        )}
      </div>

      {/* Graphique Statistiques */}
      <div className="section">
        <h2>📊 Statistiques Mensuelles</h2>
        <div style={{ height: '300px' }}>
          <Bar
            data={{
              labels: monthlyStats.map(stat => stat.name),
              datasets: [
                { label: 'Complétés', data: monthlyStats.map(stat => stat.complétés), backgroundColor: '#27ae60', borderColor: '#229954', borderWidth: 1 },
                { label: 'Annulés', data: monthlyStats.map(stat => stat.annulés), backgroundColor: '#e74c3c', borderColor: '#c0392b', borderWidth: 1 },
                { label: 'Total', data: monthlyStats.map(stat => stat.total), backgroundColor: '#3498db', borderColor: '#2980b9', borderWidth: 1 }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' }, title: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }}
          />
        </div>
      </div>

      {/* Actions Rapides */}
      <div className="actions-section">
        <h2>⚡ Actions Rapides</h2>
        <div className="actions-grid">
          <button className="action-btn action-btn-primary" onClick={() => navigate('/appointments')}>📅 Mes Rendez-vous</button>
          <button className="action-btn action-btn-success" onClick={() => navigate('/patients')}>👥 Mes Patients</button>
          <button className="action-btn action-btn-info" onClick={() => navigate('/messaging')}>💬 Messages</button>
          <button className="action-btn action-btn-warning" onClick={() => navigate('/appointments/new')}>➕ Nouveau RDV</button>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

