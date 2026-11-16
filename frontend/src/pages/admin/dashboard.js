import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';
import { API_URL } from '../../config';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClinics: 0,
    totalServices: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalAdmins: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les statistiques du backend
    fetchStats();
    fetchActivities();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Récupérer tous les utilisateurs
      const usersResponse = await fetch(`${API_URL}/users/list/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les cliniques
      const clinicsResponse = await fetch(`${API_URL}/clinics/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les services
      const servicesResponse = await fetch(`${API_URL}/services/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let totalUsers = 0;
      let totalPatients = 0;
      let totalDoctors = 0;
      let totalReceptionists = 0;
      let totalAdmins = 0;
      let totalClinics = 0;
      let totalServices = 0;

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        totalUsers = usersData.count || 0;

        // Compter par type
        usersData.users.forEach(user => {
          if (user.user_type === 'patient') totalPatients++;
          else if (user.user_type === 'doctor') totalDoctors++;
          else if (user.user_type === 'receptionist') totalReceptionists++;
          else if (user.user_type === 'admin') totalAdmins++;
        });
      }

      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        totalClinics = Array.isArray(clinicsData) ? clinicsData.length : 0;
      }

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        totalServices = Array.isArray(servicesData) ? servicesData.length : 0;
      }

      setStats({
        totalUsers,
        totalClinics,
        totalServices,
        totalPatients,
        totalDoctors,
        totalReceptionists,
        totalAdmins,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const activitiesList = [];

      // Récupérer les utilisateurs récents
      const usersResponse = await fetch(`${API_URL}/users/list/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Prendre les 3 derniers utilisateurs créés
        if (usersData.users && usersData.users.length > 0) {
          usersData.users.slice(0, 3).forEach(user => {
            activitiesList.push({
              id: `user-${user.id}`,
              type: 'user',
              time: 'Récemment',
              text: `👤 Nouvel utilisateur créé: ${user.first_name || user.email}`,
              icon: '👤'
            });
          });
        }
      }

      // Récupérer les cliniques récentes
      const clinicsResponse = await fetch(`${API_URL}/clinics/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (clinicsResponse.ok) {
        const clinicsData = await clinicsResponse.json();
        // Prendre les 2 dernières cliniques créées
        if (Array.isArray(clinicsData) && clinicsData.length > 0) {
          clinicsData.slice(0, 2).forEach(clinic => {
            activitiesList.push({
              id: `clinic-${clinic.id}`,
              type: 'clinic',
              time: 'Récemment',
              text: `🏥 Clinique "${clinic.name}" ajoutée`,
              icon: '🏥'
            });
          });
        }
      }

      // Récupérer les patients récents
      const patientsResponse = await fetch(`${API_URL}/users/list/?user_type=patient`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        // Prendre les 2 derniers patients créés
        if (patientsData.users && patientsData.users.length > 0) {
          patientsData.users.slice(0, 2).forEach(patient => {
            activitiesList.push({
              id: `patient-${patient.id}`,
              type: 'patient',
              time: 'Récemment',
              text: `🤒 Patient "${patient.first_name || patient.email}" enregistré`,
              icon: '🤒'
            });
          });
        }
      }

      setActivities(activitiesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h1>📊 Tableau de Bord Admin</h1>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => navigate('/admin/users-list')}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Utilisateurs</h3>
            <p className="stat-number">{loading ? '...' : stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/admin/clinics-list')}>
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <h3>Cliniques</h3>
            <p className="stat-number">{loading ? '...' : stats.totalClinics}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/admin/services-list')}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Services</h3>
            <p className="stat-number">{loading ? '...' : stats.totalServices}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/admin/users-list?user_type=patient')}>
          <div className="stat-icon">🤒</div>
          <div className="stat-content">
            <h3>Patients</h3>
            <p className="stat-number">{loading ? '...' : stats.totalPatients}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/admin/users-list?user_type=doctor')}>
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-content">
            <h3>Médecins</h3>
            <p className="stat-number">{loading ? '...' : stats.totalDoctors}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/admin/users-list?user_type=receptionist')}>
          <div className="stat-icon">📞</div>
          <div className="stat-content">
            <h3>Réceptionnistes</h3>
            <p className="stat-number">{loading ? '...' : stats.totalReceptionists}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/admin/users-list?user_type=admin')}>
          <div className="stat-icon">👨‍💼</div>
          <div className="stat-content">
            <h3>Admins</h3>
            <p className="stat-number">{loading ? '...' : stats.totalAdmins}</p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="actions-section">
        <h2>⚡ Actions Rapides</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => navigate('/admin/create-user')}>➕ Ajouter Utilisateur</button>
          <button className="action-btn" onClick={() => navigate('/admin/create-clinic')}>🏥 Ajouter Clinique</button>
          <button className="action-btn" onClick={() => navigate('/admin/reports')}>📊 Voir Rapports</button>
        </div>
      </div>

      {/* Activité récente */}
      <div className="activity-section">
        <h2>📋 Activité Récente</h2>
        <div className="activity-list">
          {activities.length > 0 ? (
            activities.map(activity => (
              <div key={activity.id} className="activity-item">
                <span className="activity-time">{activity.time}</span>
                <span className="activity-text">{activity.text}</span>
              </div>
            ))
          ) : (
            <div className="activity-item">
              <span className="activity-text">Aucune activité récente</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

