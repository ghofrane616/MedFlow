import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import '../../styles/Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    appName: 'MedFlow',
    appVersion: '1.0.0',
    maxUsersPerClinic: 50,
    appointmentDuration: 30,
    enableNotifications: true,
    enableEmailAlerts: true,
    maintenanceMode: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      // Simuler la sauvegarde des paramètres
      // En production, cela enverrait les données au backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('✅ Paramètres sauvegardés avec succès!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <FiArrowLeft /> Retour
        </button>
        <h1>⚙️ Paramètres du Système</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="settings-form">
        <form onSubmit={handleSave}>
          {/* Section Informations Générales */}
          <div className="settings-section">
            <h2>📋 Informations Générales</h2>
            
            <div className="form-group">
              <label htmlFor="appName">Nom de l'Application</label>
              <input
                type="text"
                id="appName"
                name="appName"
                value={settings.appName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="appVersion">Version</label>
              <input
                type="text"
                id="appVersion"
                name="appVersion"
                value={settings.appVersion}
                disabled
              />
            </div>
          </div>

          {/* Section Configuration */}
          <div className="settings-section">
            <h2>⚙️ Configuration</h2>
            
            <div className="form-group">
              <label htmlFor="maxUsersPerClinic">Nombre Max d'Utilisateurs par Clinique</label>
              <input
                type="number"
                id="maxUsersPerClinic"
                name="maxUsersPerClinic"
                value={settings.maxUsersPerClinic}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="appointmentDuration">Durée des Rendez-vous (minutes)</label>
              <input
                type="number"
                id="appointmentDuration"
                name="appointmentDuration"
                value={settings.appointmentDuration}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Section Notifications */}
          <div className="settings-section">
            <h2>🔔 Notifications</h2>
            
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="enableNotifications"
                name="enableNotifications"
                checked={settings.enableNotifications}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="enableNotifications">Activer les Notifications</label>
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="enableEmailAlerts"
                name="enableEmailAlerts"
                checked={settings.enableEmailAlerts}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="enableEmailAlerts">Activer les Alertes Email</label>
            </div>
          </div>

          {/* Section Maintenance */}
          <div className="settings-section">
            <h2>🔧 Maintenance</h2>
            
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="maintenanceMode"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="maintenanceMode">Mode Maintenance</label>
              <p className="help-text">Désactiver l'accès des utilisateurs pendant la maintenance</p>
            </div>
          </div>

          {/* Actions */}
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/dashboard')}
              disabled={loading}
            >
              ❌ Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <FiSave /> {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

