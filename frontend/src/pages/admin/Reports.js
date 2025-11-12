import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import '../../styles/Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClinics: 0,
    totalServices: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalAdmins: 0,
    totalAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Récupérer les utilisateurs
      const usersResponse = await fetch('http://localhost:8000/api/users/list/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les cliniques
      const clinicsResponse = await fetch('http://localhost:8000/api/clinics/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les services
      const servicesResponse = await fetch('http://localhost:8000/api/services/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les rendez-vous
      const appointmentsResponse = await fetch('http://localhost:8000/api/appointments/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let totalUsers = 0;
      let totalPatients = 0;
      let totalDoctors = 0;
      let totalReceptionists = 0;
      let totalAdmins = 0;
      let totalClinics = 0;
      let totalServices = 0;
      let totalAppointments = 0;

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        totalUsers = usersData.count || 0;
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

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        totalAppointments = appointmentsData.count || appointmentsData.length || 0;
      }

      setStats({
        totalUsers,
        totalClinics,
        totalServices,
        totalPatients,
        totalDoctors,
        totalReceptionists,
        totalAdmins,
        totalAppointments,
      });
    } catch (err) {
      setError('Erreur lors de la récupération des statistiques: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    const reportData = `
RAPPORT STATISTIQUES MEDFLOW
============================
Date: ${new Date().toLocaleDateString('fr-FR')}

UTILISATEURS:
- Total: ${stats.totalUsers}
- Patients: ${stats.totalPatients}
- Médecins: ${stats.totalDoctors}
- Réceptionnistes: ${stats.totalReceptionists}
- Administrateurs: ${stats.totalAdmins}

CLINIQUES: ${stats.totalClinics}

SERVICES: ${stats.totalServices}

RENDEZ-VOUS: ${stats.totalAppointments}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportData));
    element.setAttribute('download', `rapport_medflow_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <FiArrowLeft /> Retour
        </button>
        <h1>📊 Rapports et Statistiques</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">⏳ Chargement des statistiques...</div>
      ) : (
        <>
          <div className="reports-grid">
            <div className="report-card">
              <div className="report-icon">👥</div>
              <div className="report-content">
                <h3>Utilisateurs Totaux</h3>
                <p className="report-number">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">🤒</div>
              <div className="report-content">
                <h3>Patients</h3>
                <p className="report-number">{stats.totalPatients}</p>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">👨‍⚕️</div>
              <div className="report-content">
                <h3>Médecins</h3>
                <p className="report-number">{stats.totalDoctors}</p>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">📞</div>
              <div className="report-content">
                <h3>Réceptionnistes</h3>
                <p className="report-number">{stats.totalReceptionists}</p>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">👨‍💼</div>
              <div className="report-content">
                <h3>Administrateurs</h3>
                <p className="report-number">{stats.totalAdmins}</p>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">🏥</div>
              <div className="report-content">
                <h3>Cliniques</h3>
                <p className="report-number">{stats.totalClinics}</p>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">📋</div>
              <div className="report-content">
                <h3>Services</h3>
                <p className="report-number">{stats.totalServices}</p>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">📅</div>
              <div className="report-content">
                <h3>Rendez-vous</h3>
                <p className="report-number">{stats.totalAppointments}</p>
              </div>
            </div>
          </div>

          <div className="reports-actions">
            <button className="btn btn-primary" onClick={handleDownloadReport}>
              <FiDownload /> Télécharger Rapport
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;

