import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments } from '../../api/appointments';
import { getMyProfile, getMedicalHistory } from '../../api/patients';
import '../../styles/Dashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [nextDayAppointments, setNextDayAppointments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [medicalInfo, setMedicalInfo] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });
  const [countdown, setCountdown] = useState('');
  const [recentCompletedAppointments, setRecentCompletedAppointments] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [healthScore, setHealthScore] = useState(0);
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    fetchPatientData();
  }, []);

  // Compte à rebours pour le prochain rendez-vous
  useEffect(() => {
    if (!nextAppointment) return;

    const updateCountdown = () => {
      const now = new Date();
      const appointmentDate = new Date(nextAppointment.appointment_date);
      const diff = appointmentDate - now;

      if (diff <= 0) {
        setCountdown('Rendez-vous en cours ou passé');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`Dans ${days} jour${days > 1 ? 's' : ''} et ${hours} heure${hours > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setCountdown(`Dans ${hours} heure${hours > 1 ? 's' : ''} et ${minutes} minute${minutes > 1 ? 's' : ''}`);
      } else {
        setCountdown(`Dans ${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Mise à jour chaque minute

    return () => clearInterval(interval);
  }, [nextAppointment]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Récupérer le profil patient
      const profile = await getMyProfile();
      setPatientProfile(profile);

      // Récupérer les rendez-vous
      const appointmentsData = await getMyAppointments();
      setAppointments(appointmentsData);

      // Calculer les statistiques
      const now = new Date();
      const upcoming = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate > now && (apt.status === 'scheduled' || apt.status === 'confirmed');
      }).length;

      const completed = appointmentsData.filter(apt => apt.status === 'completed').length;
      const cancelled = appointmentsData.filter(apt => apt.status === 'cancelled').length;

      setStats({
        total: appointmentsData.length,
        upcoming: upcoming,
        completed: completed,
        cancelled: cancelled
      });

      // Trouver le prochain rendez-vous (status = scheduled ou confirmed, date future)
      const futureAppointments = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate > now && (apt.status === 'scheduled' || apt.status === 'confirmed');
      }).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

      if (futureAppointments.length > 0) {
        setNextAppointment(futureAppointments[0]);

        // Trouver tous les rendez-vous du même jour
        const nextDate = new Date(futureAppointments[0].appointment_date);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        const sameDayAppointments = futureAppointments.filter(apt => {
          const aptDateStr = new Date(apt.appointment_date).toISOString().split('T')[0];
          return aptDateStr === nextDateStr;
        });

        setNextDayAppointments(sameDayAppointments);
      }

      // Récupérer les 3 dernières consultations complétées
      const completedAppointments = appointmentsData
        .filter(apt => apt.status === 'completed')
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
        .slice(0, 3);
      setRecentCompletedAppointments(completedAppointments);

      // Calculer les statistiques mensuelles pour le graphique (6 derniers mois)
      const monthlyData = calculateMonthlyStats(appointmentsData);
      setMonthlyStats(monthlyData);

      // Générer les rappels pour les rendez-vous à venir
      const reminders = generateReminders(futureAppointments);
      setUpcomingReminders(reminders);

      // Récupérer l'historique médical
      if (profile.id) {
        const medicalData = await getMedicalHistory(profile.id);
        setMedicalInfo(medicalData);

        // Extraire les médicaments de l'historique médical
        if (medicalData.current_medications) {
          const meds = parseMedications(medicalData.current_medications);
          setMedications(meds);
        }
      }

      // Calculer le score de santé
      const score = calculateHealthScore(appointmentsData, profile);
      setHealthScore(score);

    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'scheduled': 'Programmé',
      'confirmed': 'Confirmé',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'no_show': 'Absent'
    };
    return statusMap[status] || status;
  };

  // Calculer les statistiques mensuelles pour le graphique
  const calculateMonthlyStats = (appointmentsData) => {
    const months = [];
    const now = new Date();

    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      const year = date.getFullYear();

      const monthAppointments = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === date.getMonth() &&
               aptDate.getFullYear() === date.getFullYear();
      });

      months.push({
        name: `${monthName} ${year}`,
        total: monthAppointments.length,
        complétés: monthAppointments.filter(apt => apt.status === 'completed').length,
        annulés: monthAppointments.filter(apt => apt.status === 'cancelled').length
      });
    }

    return months;
  };

  // Générer le calendrier du mois en cours
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    let week = [];

    // Ajouter les jours vides au début
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];

      // Vérifier s'il y a des rendez-vous ce jour-là
      const dayAppointments = appointments.filter(apt => {
        const aptDateStr = new Date(apt.appointment_date).toISOString().split('T')[0];
        return aptDateStr === dateStr && (apt.status === 'scheduled' || apt.status === 'confirmed');
      });

      week.push({
        day,
        date,
        hasAppointments: dayAppointments.length > 0,
        appointmentsCount: dayAppointments.length
      });

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    // Compléter la dernière semaine
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }

    return calendar;
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Générer les rappels pour les rendez-vous à venir
  const generateReminders = (futureAppointments) => {
    const now = new Date();
    const reminders = [];

    futureAppointments.slice(0, 3).forEach(apt => {
      const aptDate = new Date(apt.appointment_date);
      const diffTime = aptDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

      let message = '';
      let urgency = 'normal';

      if (diffHours <= 24) {
        message = `Rendez-vous avec ${apt.doctor_name} dans ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        urgency = 'urgent';
      } else if (diffDays <= 3) {
        message = `Rendez-vous avec ${apt.doctor_name} dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        urgency = 'warning';
      } else if (diffDays <= 7) {
        message = `Rendez-vous avec ${apt.doctor_name} le ${formatDate(apt.appointment_date)}`;
        urgency = 'normal';
      }

      if (message) {
        reminders.push({
          id: apt.id,
          message,
          urgency,
          date: apt.appointment_date
        });
      }
    });

    return reminders;
  };

  // Parser les médicaments depuis le texte
  const parseMedications = (medicationsText) => {
    if (!medicationsText) return [];

    // Exemple de format: "Paracétamol 500mg - 3x/jour, Ibuprofène 200mg - 2x/jour"
    const medsList = medicationsText.split(',').map(med => {
      const parts = med.trim().split('-');
      return {
        name: parts[0]?.trim() || 'Médicament',
        dosage: parts[1]?.trim() || 'Selon prescription'
      };
    });

    return medsList.slice(0, 5); // Limiter à 5 médicaments
  };

  // Calculer le score de santé (0-100)
  const calculateHealthScore = (appointmentsData, profile) => {
    let score = 50; // Score de base

    // Bonus pour les rendez-vous réguliers
    const last3Months = appointmentsData.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return aptDate >= threeMonthsAgo;
    });

    if (last3Months.length >= 3) score += 20;
    else if (last3Months.length >= 1) score += 10;

    // Bonus pour les rendez-vous complétés (pas annulés)
    const completedRate = appointmentsData.length > 0
      ? (appointmentsData.filter(apt => apt.status === 'completed').length / appointmentsData.length) * 100
      : 0;

    if (completedRate >= 80) score += 20;
    else if (completedRate >= 50) score += 10;

    // Bonus pour avoir des informations médicales complètes
    if (profile?.date_of_birth) score += 5;
    if (profile?.phone) score += 5;

    return Math.min(score, 100); // Maximum 100
  };

  // Obtenir la couleur du score de santé
  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  // Obtenir le message du score de santé
  const getHealthScoreMessage = (score) => {
    if (score >= 80) return 'Excellent suivi médical ! 🎉';
    if (score >= 60) return 'Bon suivi, continuez ! 👍';
    return 'Pensez à prendre rendez-vous régulièrement 📅';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Chargement de vos données...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>🤒 Mon Tableau de Bord</h1>

      {/* Notifications et Rappels */}
      {upcomingReminders.length > 0 && (
        <div className="notifications-section">
          <h2>🔔 Rappels de Rendez-vous</h2>
          <div className="notifications-list">
            {upcomingReminders.map((reminder) => (
              <div key={reminder.id} className={`notification-card ${reminder.urgency}`}>
                <div className="notification-icon">
                  {reminder.urgency === 'urgent' ? '🚨' : reminder.urgency === 'warning' ? '⚠️' : '📅'}
                </div>
                <div className="notification-content">
                  <p>{reminder.message}</p>
                  <span className="notification-time">
                    {formatTime(reminder.date)}
                  </span>
                </div>
                <button
                  className="notification-btn"
                  onClick={() => navigate(`/appointments/${reminder.id}`)}
                >
                  Voir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Rendez-vous</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">À venir</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Complétés</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">Annulés</div>
          </div>
        </div>
      </div>

      {/* Prochain rendez-vous avec compte à rebours */}
      {nextAppointment && (
        <div className="next-appointment-card highlight">
          <div className="appointment-header-section">
            <h2>📅 Prochain Rendez-vous - {formatDate(nextAppointment.appointment_date)}</h2>
            {countdown && (
              <div className="countdown-badge">
                ⏰ {countdown}
              </div>
            )}
          </div>

          {nextDayAppointments.length > 1 && (
            <p className="multiple-appointments-notice">
              📌 Vous avez {nextDayAppointments.length} rendez-vous ce jour-là
            </p>
          )}

          {nextDayAppointments.map((apt, index) => (
            <div key={apt.id} className="appointment-details" style={{
              marginBottom: index < nextDayAppointments.length - 1 ? '20px' : '0',
              paddingBottom: index < nextDayAppointments.length - 1 ? '20px' : '0',
              borderBottom: index < nextDayAppointments.length - 1 ? '2px solid #e0e0e0' : 'none'
            }}>
              <div className="detail-row">
                <span className="label">Heure:</span>
                <span className="value">{formatTime(apt.appointment_date)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Médecin:</span>
                <span className="value">{apt.doctor_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Clinique:</span>
                <span className="value">{apt.clinic_name}</span>
              </div>
              {apt.service_name && (
                <div className="detail-row">
                  <span className="label">Service:</span>
                  <span className="value">{apt.service_name}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">Durée:</span>
                <span className="value">{apt.duration} minutes</span>
              </div>
              <div className="detail-row">
                <span className="label">Motif:</span>
                <span className="value">{apt.reason || 'Non spécifié'}</span>
              </div>
              <button
                className="btn-primary"
                onClick={() => navigate(`/appointments/${apt.id}`)}
                style={{ marginTop: '10px' }}
              >
                Voir les détails
              </button>
            </div>
          ))}
        </div>
      )}

      {!nextAppointment && (
        <div className="next-appointment-card">
          <h2>📅 Prochain Rendez-vous</h2>
          <p>Vous n'avez aucun rendez-vous programmé.</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/appointments/new')}
          >
            Prendre un rendez-vous
          </button>
        </div>
      )}

      {/* Dernières consultations */}
      {recentCompletedAppointments.length > 0 && (
        <div className="section">
          <h2>🩺 Dernières Consultations</h2>
          <div className="consultations-list">
            {recentCompletedAppointments.map((apt) => (
              <div key={apt.id} className="consultation-card">
                <div className="consultation-header">
                  <div className="consultation-date">
                    <span className="date-icon">📅</span>
                    <span>{formatDate(apt.appointment_date)}</span>
                  </div>
                  <span className="completed-badge">✅ Complété</span>
                </div>
                <div className="consultation-body">
                  <div className="consultation-info">
                    <p><strong>Médecin:</strong> {apt.doctor_name}</p>
                    <p><strong>Service:</strong> {apt.service_name || 'Non spécifié'}</p>
                    <p><strong>Motif:</strong> {apt.reason || 'Non spécifié'}</p>
                    {apt.notes && (
                      <div className="consultation-notes">
                        <strong>Notes du médecin:</strong>
                        <p>{apt.notes}</p>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-small"
                    onClick={() => navigate(`/appointments/${apt.id}`)}
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendrier et Graphique côte à côte */}
      <div className="dashboard-grid">
        {/* Mini Calendrier */}
        <div className="section calendar-section">
          <h2>📅 Calendrier des Rendez-vous</h2>
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={() => changeMonth(-1)}>
              ◀
            </button>
            <h3>
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>
              ▶
            </button>
          </div>
          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {generateCalendar().map((week, weekIndex) => (
                <div key={weekIndex} className="calendar-week">
                  {week.map((dayInfo, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`calendar-day ${
                        dayInfo ? (dayInfo.hasAppointments ? 'has-appointment' : '') : 'empty'
                      } ${
                        dayInfo && dayInfo.date.toDateString() === new Date().toDateString()
                          ? 'today'
                          : ''
                      }`}
                    >
                      {dayInfo && (
                        <>
                          <span className="day-number">{dayInfo.day}</span>
                          {dayInfo.hasAppointments && (
                            <span className="appointment-indicator">
                              {dayInfo.appointmentsCount}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mes rendez-vous */}
      <div className="section">
        <h2>📋 Tous Mes Rendez-vous</h2>
        {appointments.length === 0 ? (
          <p>Vous n'avez aucun rendez-vous.</p>
        ) : (
          <div className="appointments-list">
            {appointments.slice(0, 5).map((apt) => (
              <div key={apt.id} className="appointment-item">
                <div className="appointment-info">
                  <h4>{formatDate(apt.appointment_date)} à {formatTime(apt.appointment_date)}</h4>
                  <p>Médecin: {apt.doctor_name}</p>
                  <p>Motif: {apt.reason || 'Non spécifié'}</p>
                  <span className={`status ${apt.status.toLowerCase()}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
                <button
                  className="btn-small"
                  onClick={() => navigate(`/appointments/${apt.id}`)}
                >
                  Détails
                </button>
              </div>
            ))}
          </div>
        )}
        {appointments.length > 5 && (
          <button
            className="btn-secondary"
            onClick={() => navigate('/appointments')}
            style={{ marginTop: '15px' }}
          >
            Voir tous mes rendez-vous ({appointments.length})
          </button>
        )}
      </div>

      {/* Rappel de Médicaments */}
      {medications.length > 0 && (
        <div className="section medications-section">
          <h2>💊 Mes Médicaments</h2>
          <div className="medications-grid">
            {medications.map((med, index) => (
              <div key={index} className="medication-card">
                <div className="medication-icon">💊</div>
                <div className="medication-info">
                  <h4>{med.name}</h4>
                  <p>{med.dosage}</p>
                </div>
                <div className="medication-status">
                  <span className="status-badge active">Actif</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informations santé */}
      <div className="section">
        <h2>❤️ Informations Santé</h2>
        {medicalInfo ? (
          <div className="health-info">
            <div className="health-item">
              <span className="label">Groupe sanguin:</span>
              <span className="value">{medicalInfo.blood_type || 'Non renseigné'}</span>
            </div>
            <div className="health-item">
              <span className="label">Allergies:</span>
              <span className="value">{medicalInfo.allergies || 'Aucune'}</span>
            </div>
            <div className="health-item">
              <span className="label">Médicaments actuels:</span>
              <span className="value">{medicalInfo.current_medications || 'Aucun'}</span>
            </div>
            {medicalInfo.medical_history && (
              <div className="health-item">
                <span className="label">Historique médical:</span>
                <span className="value">{medicalInfo.medical_history}</span>
              </div>
            )}
          </div>
        ) : (
          <p>Aucune information médicale disponible.</p>
        )}
      </div>

      {/* Informations personnelles */}
      <div className="section">
        <h2>👤 Mes Informations</h2>
        {patientProfile && (
          <div className="health-info">
            <div className="health-item">
              <span className="label">Nom complet:</span>
              <span className="value">{patientProfile.user_full_name || `${patientProfile.user?.first_name} ${patientProfile.user?.last_name}`}</span>
            </div>
            <div className="health-item">
              <span className="label">Email:</span>
              <span className="value">{patientProfile.user?.email || 'Non renseigné'}</span>
            </div>
            <div className="health-item">
              <span className="label">Téléphone:</span>
              <span className="value">{patientProfile.user?.phone_number || 'Non renseigné'}</span>
            </div>
            <div className="health-item">
              <span className="label">Date de naissance:</span>
              <span className="value">
                {patientProfile.user?.date_of_birth ? formatDate(patientProfile.user.date_of_birth) : 'Non renseignée'}
              </span>
            </div>
            <div className="health-item">
              <span className="label">Adresse:</span>
              <span className="value">{patientProfile.user?.address || 'Non renseignée'}</span>
            </div>
            <div className="health-item">
              <span className="label">Clinique:</span>
              <span className="value">{patientProfile.clinic_name || patientProfile.clinic?.name || 'Non renseignée'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;

