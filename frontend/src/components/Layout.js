import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiHome, FiUsers, FiCalendar, FiFileText, FiUser, FiMessageSquare } from 'react-icons/fi';
import { logout, getUser, getAccessToken } from '../utils/auth';
import '../styles/Layout.css';
import { API_URL } from '../config';

/**
 * Composant Layout principal pour MedFlow
 * Fournit la navigation et la structure commune à toutes les pages
 */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const navigate = useNavigate();
  const user = getUser();

  // Récupérer les données du profil complet
  const fetchProfileData = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/auth/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  // Récupérer le nombre de messages non lus
  const fetchUnreadMessagesCount = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/conversations/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const conversations = Array.isArray(data) ? data : data.results || [];

        // Calculer le total de messages non lus
        const totalUnread = conversations.reduce((sum, conv) => {
          return sum + (conv.unread_count || 0);
        }, 0);

        setUnreadMessagesCount(totalUnread);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus:', error);
    }
  };

  // Charger les données du profil et les messages non lus au montage
  useEffect(() => {
    if (user) {
      fetchProfileData(); // Charger la photo de profil
      fetchUnreadMessagesCount();
      const interval = setInterval(fetchUnreadMessagesCount, 30000); // Rafraîchir toutes les 30 secondes
      return () => clearInterval(interval);
    }
  }, [user]);

  // Ouvrir le modal et récupérer les données
  const handleOpenProfile = () => {
    fetchProfileData();
    setShowProfileModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/login');
    }
  };

  // Déterminer les liens de navigation selon le rôle
  const getNavLinks = () => {
    if (!user) return [];

    // Déterminer le chemin d'accueil selon le rôle
    const homePath = {
      admin: '/admin/dashboard',
      doctor: '/doctor/dashboard',
      receptionist: '/receptionist/dashboard',
      patient: '/patient/dashboard',
    }[user.user_type] || '/dashboard';

    const baseLinks = [
      { label: 'Accueil', path: homePath, icon: FiHome },
      { label: 'Messagerie', path: '/messaging', icon: FiMessageSquare },
    ];

    switch (user.user_type) {
      case 'admin':
        return [
          ...baseLinks,
          { label: 'Rendez-vous', path: '/appointments', icon: FiCalendar },
          { label: 'Utilisateurs', path: '/admin/users-list', icon: FiUsers },
          { label: 'Cliniques', path: '/admin/clinics-list', icon: FiHome },
          { label: 'Rapports', path: '/admin/reports', icon: FiFileText },
        ];
      case 'doctor':
        return [
          ...baseLinks,
          { label: 'Rendez-vous', path: '/appointments', icon: FiCalendar },
          { label: 'Ordonnances', path: '/prescriptions', icon: FiFileText },
          { label: 'Patients', path: '/patients', icon: FiUsers },
        ];
      case 'receptionist':
        return [
          ...baseLinks,
          { label: 'Rendez-vous', path: '/appointments', icon: FiCalendar },
          { label: 'Patients', path: '/receptionist/patients-list', icon: FiUsers },
        ];
      case 'patient':
        return [
          ...baseLinks,
          { label: 'Mes Rendez-vous', path: '/appointments', icon: FiCalendar },
          { label: 'Mes Ordonnances', path: '/prescriptions', icon: FiFileText },
        ];
      default:
        return baseLinks;
    }
  };

  const navLinks = getNavLinks();

  // Déterminer le chemin d'accueil pour le logo
  const homePath = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    receptionist: '/receptionist/dashboard',
    patient: '/patient/dashboard',
  }[user?.user_type] || '/dashboard';

  return (
    <div className="layout">
      {/* Header */}
      <header className="layout-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <Link to={homePath} className="logo">
              <h1>MedFlow</h1>
            </Link>
          </div>

          <div className="header-right">
            {user && (
              <div className="user-info">
                <span className="user-name">{user.first_name || user.username}</span>
                <span className="user-type">({user.user_type})</span>

                {/* Photo de profil */}
                <div
                  className="profile-picture-container"
                  onClick={() => navigate('/profile')}
                  title="Mon Profil"
                  style={{ cursor: 'pointer' }}
                >
                  {profileData?.profile_picture_url ? (
                    <img
                      src={profileData.profile_picture_url}
                      alt="Profil"
                      className="header-profile-picture"
                    />
                  ) : (
                    <div className="header-profile-placeholder">
                      <FiUser size={24} />
                    </div>
                  )}
                </div>

                <button
                  className="logout-btn"
                  onClick={handleLogout}
                  title="Déconnexion"
                >
                  <FiLogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="layout-container">
        {/* Sidebar */}
        <aside className={`layout-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isMessaging = link.label === 'Messagerie';
              const showBadge = isMessaging && unreadMessagesCount > 0;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="nav-link"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                  {showBadge && (
                    <span className="notification-badge">{unreadMessagesCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="layout-main">
          {children}
        </main>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modal Profil */}
      {showProfileModal && profileData && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>👤 Mon Profil</h2>
              <button
                className="profile-modal-close"
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="profile-modal-content">
              {/* Informations de base */}
              <div className="profile-section">
                <h3>Informations Personnelles</h3>
                <div className="profile-item">
                  <span className="profile-label">Prénom:</span>
                  <span className="profile-value">{profileData.first_name || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Nom:</span>
                  <span className="profile-value">{profileData.last_name || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{profileData.email || 'N/A'}</span>
                </div>
              </div>

              {/* Informations Médecin */}
              {profileData.user_type === 'doctor' && profileData.doctor_profile && (
                <div className="profile-section">
                  <h3>Informations Professionnelles</h3>
                  <div className="profile-item">
                    <span className="profile-label">Spécialité:</span>
                    <span className="profile-value">{profileData.doctor_profile.specialization || 'N/A'}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Jours de travail:</span>
                    <span className="profile-value">
                      {profileData.doctor_profile.available_days && profileData.doctor_profile.available_days.length > 0
                        ? profileData.doctor_profile.available_days.join(', ')
                        : 'Non renseigné'}
                    </span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Horaires:</span>
                    <span className="profile-value">
                      {profileData.doctor_profile.available_hours && profileData.doctor_profile.available_hours.start && profileData.doctor_profile.available_hours.end
                        ? `${profileData.doctor_profile.available_hours.start} - ${profileData.doctor_profile.available_hours.end}`
                        : 'Non renseigné'}
                    </span>
                  </div>
                </div>
              )}

              {/* Informations Réceptionniste */}
              {profileData.user_type === 'receptionist' && profileData.receptionist_profile && (
                <div className="profile-section">
                  <h3>Horaires de Travail</h3>
                  <div className="profile-item">
                    <span className="profile-label">Début de service:</span>
                    <span className="profile-value">{profileData.receptionist_profile.shift_start || 'N/A'}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Fin de service:</span>
                    <span className="profile-value">{profileData.receptionist_profile.shift_end || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

