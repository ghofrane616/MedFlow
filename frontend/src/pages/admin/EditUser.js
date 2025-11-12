import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import '../../styles/EditUser.css';

const EditUser = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    // Champs spécifiques à la réceptionniste
    shift_start: '08:00',
    shift_end: '17:00',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    permissions: {},
    is_active: true,
    // Champs spécifiques au patient
    gender: '',
    blood_type: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    insurance_number: '',
    insurance_provider: '',
    // Champs spécifiques au médecin
    specialization: '',
    license_number: '',
    years_of_experience: '',
    education: '',
    certifications: '',
    consultation_fee: '',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    available_hours: { start: '09:00', end: '17:00' },
    is_available: true,
  });
  const [errors, setErrors] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [resetUserData, setResetUserData] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);

        // Charger les données de réceptionniste si disponibles
        let receptionistData = {};
        if (data.user_type === 'receptionist' && data.receptionist_profile) {
          const profile = data.receptionist_profile;
          receptionistData = {
            shift_start: profile.shift_start || '08:00',
            shift_end: profile.shift_end || '17:00',
            working_days: profile.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            permissions: profile.permissions || {},
            is_active: profile.is_active !== undefined ? profile.is_active : true,
          };
        }

        // Charger les données de patient si disponibles
        let patientData = {};
        if (data.user_type === 'patient' && data.patient_profile) {
          const profile = data.patient_profile;
          patientData = {
            gender: profile.gender || '',
            blood_type: profile.blood_type || '',
            emergency_contact_name: profile.emergency_contact_name || '',
            emergency_contact_phone: profile.emergency_contact_phone || '',
            emergency_contact_relationship: profile.emergency_contact_relationship || '',
            medical_history: profile.medical_history || '',
            allergies: profile.allergies || '',
            current_medications: profile.current_medications || '',
            insurance_number: profile.insurance_number || '',
            insurance_provider: profile.insurance_provider || '',
          };
        }

        // Charger les données de médecin si disponibles
        let doctorData = {};
        if (data.user_type === 'doctor' && data.doctor_profile) {
          const profile = data.doctor_profile;
          doctorData = {
            specialization: profile.specialization || '',
            license_number: profile.license_number || '',
            years_of_experience: profile.years_of_experience || '',
            education: profile.education || '',
            certifications: profile.certifications || '',
            consultation_fee: profile.consultation_fee || '',
            available_days: profile.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            available_hours: profile.available_hours || { start: '09:00', end: '17:00' },
            is_available: profile.is_available !== undefined ? profile.is_available : true,
          };
        }

        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          date_of_birth: data.date_of_birth || '',
          ...receptionistData,
          ...patientData,
          ...doctorData
        });
        setError('');
      } else {
        setError('Utilisateur non trouvé');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user && user.user_type === 'receptionist') {
      fetchServices();
      fetchReceptionistServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/services/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des services:', err);
    }
  };

  const fetchReceptionistServices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.receptionist_profile && data.receptionist_profile.services) {
          setSelectedServices(data.receptionist_profile.services);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'Le prénom est requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Le téléphone est requis';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'La date de naissance est requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('access_token');

      // Préparer les données à envoyer
      let dataToSend = { ...formData };

      // Si c'est une réceptionniste, ajouter les services sélectionnés
      if (user && user.user_type === 'receptionist') {
        dataToSend.services = selectedServices;
      }

      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        setSuccess('✅ Utilisateur modifié avec succès!');
        setTimeout(() => navigate('/admin/users-list'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.detail || 'Erreur lors de la modification');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setSuccess('✅ Utilisateur supprimé avec succès!');
          setTimeout(() => navigate('/admin/users-list'), 2000);
        } else {
          setError('Erreur lors de la suppression');
        }
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');

      const response = await fetch(`http://localhost:8000/api/users/${userId}/reset-password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTempPassword(data.temporary_password);
        setResetUserData(data);
        setShowResetModal(true);
        setSuccess('✅ Mot de passe réinitialisé!');
      } else {
        setError('Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');

      const response = await fetch(`http://localhost:8000/api/users/${userId}/toggle-status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSuccess(data.message);
      } else {
        setError('Erreur lors de la modification du statut');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    setSuccess('✅ Mot de passe copié!');
  };

  if (loading && !user) {
    return (
      <div className="edit-user-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="edit-user-container">
      <button className="back-btn" onClick={() => navigate('/admin/users-list')}>
        <FiArrowLeft /> Retour
      </button>

      <div className={`edit-user-card ${user && !user.is_active ? 'inactive-account' : ''}`}>
        <h1>✏️ Modifier l'Utilisateur</h1>

        {user && !user.is_active && (
          <div className="inactive-warning">
            ⚠️ <strong>Ce compte est désactivé</strong> - L'utilisateur ne peut pas se connecter
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {user && (
          <form onSubmit={handleSubmit}>
            <div className="user-info-header">
              <div className="user-type-badge" style={{ backgroundColor: '#667eea' }}>
                {user.user_type === 'admin' ? '👨‍💼 Admin' : 
                 user.user_type === 'doctor' ? '👨‍⚕️ Médecin' : 
                 user.user_type === 'receptionist' ? '📞 Réceptionniste' : 
                 '🤒 Patient'}
              </div>
              <p className="username">@{user.username}</p>
            </div>

            <div className={`form-section ${!user.is_active ? 'disabled-section' : ''}`}>
              <h3>Informations Personnelles</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Prénom *</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Jean"
                      disabled={loading || !user.is_active}
                    />
                  </div>
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Nom *</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Dupont"
                      disabled={loading || !user.is_active}
                    />
                  </div>
                  {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jean@example.com"
                      disabled={loading || !user.is_active}
                    />
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone_number">Téléphone *</label>
                  <div className="input-wrapper">
                    <FiPhone className="input-icon" />
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="+33612345678"
                      disabled={loading || !user.is_active}
                    />
                  </div>
                  {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="date_of_birth">Date de naissance *</label>
                <div className="input-wrapper">
                  <FiCalendar className="input-icon" />
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    disabled={loading || !user.is_active}
                  />
                </div>
                {errors.date_of_birth && <span className="error-message">{errors.date_of_birth}</span>}
              </div>
            </div>

            {/* Horaires et Permissions pour Réceptionniste */}
            {user && user.user_type === 'receptionist' && (
              <div className={`form-section ${!user.is_active ? 'disabled-section' : ''}`}>
                <h3>Horaires et Permissions</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shift_start">Heure de début *</label>
                    <input
                      type="time"
                      id="shift_start"
                      name="shift_start"
                      value={formData.shift_start}
                      onChange={handleChange}
                      disabled={loading || !user.is_active}
                    />
                    {errors.shift_start && <span className="error-message">{errors.shift_start}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="shift_end">Heure de fin *</label>
                    <input
                      type="time"
                      id="shift_end"
                      name="shift_end"
                      value={formData.shift_end}
                      onChange={handleChange}
                      disabled={loading || !user.is_active}
                    />
                    {errors.shift_end && <span className="error-message">{errors.shift_end}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Jours de travail *</label>
                  <div className="working-days-selector">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.working_days.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                working_days: [...prev.working_days, day]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                working_days: prev.working_days.filter(d => d !== day)
                              }));
                            }
                          }}
                          disabled={loading || !user.is_active}
                        />
                        {day === 'Monday' ? 'Lundi' : day === 'Tuesday' ? 'Mardi' : day === 'Wednesday' ? 'Mercredi' : day === 'Thursday' ? 'Jeudi' : day === 'Friday' ? 'Vendredi' : day === 'Saturday' ? 'Samedi' : 'Dimanche'}
                      </label>
                    ))}
                  </div>
                  {errors.working_days && <span className="error-message">{errors.working_days}</span>}
                </div>

                <div className="form-group">
                  <label>Services gérés</label>
                  <div className="services-selector">
                    {services.length === 0 ? (
                      <p className="no-services">Aucun service disponible. Créez d'abord des services.</p>
                    ) : (
                      services.map(service => (
                        <label key={service.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices(prev => [...prev, service.id]);
                              } else {
                                setSelectedServices(prev => prev.filter(id => id !== service.id));
                              }
                            }}
                            disabled={loading || !user.is_active}
                          />
                          {service.name} ({service.service_type})
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="is_active_receptionist">
                    <input
                      type="checkbox"
                      id="is_active_receptionist"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        is_active: e.target.checked
                      }))}
                      disabled={loading}
                    />
                    Réceptionniste Active
                  </label>
                </div>
              </div>
            )}

            {/* Informations Médicales pour Patient */}
            {user?.user_type === 'patient' && (
              <div className="form-section">
                <h3>Informations Médicales</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender">Genre</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={loading || !user.is_active}
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                      <option value="O">Autre</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="blood_type">Groupe sanguin</label>
                    <select
                      id="blood_type"
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleChange}
                      disabled={loading || !user.is_active}
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="medical_history">Antécédents médicaux</label>
                  <textarea
                    id="medical_history"
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleChange}
                    placeholder="Décrivez les antécédents médicaux..."
                    disabled={loading || !user.is_active}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="allergies">Allergies</label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="Décrivez les allergies..."
                    disabled={loading || !user.is_active}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="current_medications">Médicaments actuels</label>
                  <textarea
                    id="current_medications"
                    name="current_medications"
                    value={formData.current_medications}
                    onChange={handleChange}
                    placeholder="Décrivez les médicaments actuels..."
                    disabled={loading || !user.is_active}
                    rows="3"
                  />
                </div>
              </div>
            )}

            {/* Contact d'Urgence pour Patient */}
            {user?.user_type === 'patient' && (
              <div className="form-section">
                <h3>Contact d'Urgence</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="emergency_contact_name">Nom du contact</label>
                    <input
                      type="text"
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="Nom complet"
                      disabled={loading || !user.is_active}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="emergency_contact_phone">Téléphone du contact</label>
                    <input
                      type="tel"
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="+33 6 XX XX XX XX"
                      disabled={loading || !user.is_active}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emergency_contact_relationship">Relation avec le contact</label>
                  <input
                    type="text"
                    id="emergency_contact_relationship"
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                    placeholder="Ex: Mère, Père, Conjoint..."
                    disabled={loading || !user.is_active}
                  />
                </div>
              </div>
            )}

            {/* Assurance pour Patient */}
            {user?.user_type === 'patient' && (
              <div className="form-section">
                <h3>Assurance</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="insurance_number">Numéro d'assurance</label>
                    <input
                      type="text"
                      id="insurance_number"
                      name="insurance_number"
                      value={formData.insurance_number}
                      onChange={handleChange}
                      placeholder="Numéro d'assurance"
                      disabled={loading || !user.is_active}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="insurance_provider">Fournisseur d'assurance</label>
                    <input
                      type="text"
                      id="insurance_provider"
                      name="insurance_provider"
                      value={formData.insurance_provider}
                      onChange={handleChange}
                      placeholder="Nom du fournisseur"
                      disabled={loading || !user.is_active}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Informations Professionnelles pour Médecin */}
            {user?.user_type === 'doctor' && (
              <div className="form-section">
                <h3>Informations Professionnelles</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="specialization">Spécialisation</label>
                    <input
                      type="text"
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="Ex: Cardiologie, Dermatologie..."
                      disabled={loading || !user.is_active}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="license_number">Numéro de licence</label>
                    <input
                      type="text"
                      id="license_number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      placeholder="Numéro de licence"
                      disabled={loading || !user.is_active}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="years_of_experience">Années d'expérience</label>
                    <input
                      type="number"
                      id="years_of_experience"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      placeholder="Nombre d'années"
                      disabled={loading || !user.is_active}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="consultation_fee">Tarif de consultation (€)</label>
                    <input
                      type="number"
                      id="consultation_fee"
                      name="consultation_fee"
                      value={formData.consultation_fee}
                      onChange={handleChange}
                      placeholder="Ex: 50.00"
                      disabled={loading || !user.is_active}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="education">Formation</label>
                  <textarea
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="Décrivez votre formation..."
                    disabled={loading || !user.is_active}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="certifications">Certifications</label>
                  <textarea
                    id="certifications"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    placeholder="Décrivez vos certifications..."
                    disabled={loading || !user.is_active}
                    rows="3"
                  />
                </div>
              </div>
            )}

            {/* Disponibilité pour Médecin */}
            {user?.user_type === 'doctor' && (
              <div className="form-section">
                <h3>Disponibilité</h3>

                <div className="form-group">
                  <label>Jours de disponibilité</label>
                  <div className="working-days-selector">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.available_days.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                available_days: [...prev.available_days, day]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                available_days: prev.available_days.filter(d => d !== day)
                              }));
                            }
                          }}
                          disabled={loading || !user.is_active}
                        />
                        {day === 'Monday' ? 'Lundi' : day === 'Tuesday' ? 'Mardi' : day === 'Wednesday' ? 'Mercredi' : day === 'Thursday' ? 'Jeudi' : day === 'Friday' ? 'Vendredi' : day === 'Saturday' ? 'Samedi' : 'Dimanche'}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="available_hours_start">Heure de début</label>
                    <input
                      type="time"
                      id="available_hours_start"
                      value={formData.available_hours.start}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        available_hours: { ...prev.available_hours, start: e.target.value }
                      }))}
                      disabled={loading || !user.is_active}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="available_hours_end">Heure de fin</label>
                    <input
                      type="time"
                      id="available_hours_end"
                      value={formData.available_hours.end}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        available_hours: { ...prev.available_hours, end: e.target.value }
                      }))}
                      disabled={loading || !user.is_active}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="is_available">
                    <input
                      type="checkbox"
                      id="is_available"
                      name="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        is_available: e.target.checked
                      }))}
                      disabled={loading || !user.is_active}
                    />
                    Médecin disponible
                  </label>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate('/admin/users-list')}>
                ❌ Annuler
              </button>
              <button type="button" className="reset-pwd-btn" onClick={handleResetPassword} disabled={loading}>
                🔄 Réinitialiser MDP
              </button>
              <button
                type="button"
                className={`status-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                onClick={handleToggleStatus}
                disabled={loading}
              >
                {user.is_active ? '🚫 Désactiver' : '✅ Activer'}
              </button>
              <button type="button" className="delete-btn" onClick={handleDelete} disabled={loading}>
                🗑️ Supprimer
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '⏳ Modification...' : '✅ Modifier'}
              </button>
            </div>
          </form>
        )}

        {/* Modal pour afficher le mot de passe temporaire */}
        {showResetModal && (
          <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>🔄 Mot de passe réinitialisé</h2>
              <p className="modal-message">
                Voici les identifiants temporaires pour <strong>{user.first_name} {user.last_name}</strong>
              </p>

              <div className="credentials-box">
                <div className="credential-item">
                  <label>🆔 Code Utilisateur :</label>
                  <div className="credential-value">
                    <code>{resetUserData?.user_id || user.id}</code>
                    <button
                      className="copy-btn-small"
                      onClick={() => {
                        navigator.clipboard.writeText((resetUserData?.user_id || user.id).toString());
                        setSuccess('✅ Code copié!');
                      }}
                      title="Copier"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="credential-item">
                  <label>📧 Email :</label>
                  <div className="credential-value">
                    <code>{resetUserData?.email || user.email}</code>
                    <button
                      className="copy-btn-small"
                      onClick={() => {
                        navigator.clipboard.writeText(resetUserData?.email || user.email);
                        setSuccess('✅ Email copié!');
                      }}
                      title="Copier"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="credential-item">
                  <label>🔐 Mot de passe temporaire :</label>
                  <div className="credential-value">
                    <code>{tempPassword}</code>
                    <button className="copy-btn-small" onClick={copyToClipboard} title="Copier">
                      📋
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-warning">
                <p>⚠️ <strong>Instructions pour l'utilisateur :</strong></p>
                <ol>
                  <li><strong>Code Utilisateur</strong> : <code>{resetUserData?.user_id || user.id}</code></li>
                  <li>Se connecter avec l'<strong>email</strong> : <code>{resetUserData?.email || user.email}</code></li>
                  <li>Utiliser le <strong>mot de passe temporaire</strong> : <code>{tempPassword}</code></li>
                  <li>À la première connexion, <strong>changer le mot de passe</strong></li>
                  <li>Ne pas partager ces identifiants</li>
                </ol>
              </div>

              <button className="modal-close-btn" onClick={() => setShowResetModal(false)}>
                ✅ Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUser;

