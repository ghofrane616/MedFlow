import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiCalendar, FiLock, FiArrowLeft } from 'react-icons/fi';
import { refreshAccessToken } from '../../utils/auth';
import '../../styles/CreateUser.css';

const CreateUser = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('receptionist');
  const [clinics, setClinics] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    password: '',
    confirm_password: '',
    clinic: '',
    specialty: '',
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

  useEffect(() => {
    fetchClinics();
    fetchSpecialties();
  }, []);

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/clinics/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des cliniques:', err);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/services/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des spécialités:', err);
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

    if (!formData.username.trim()) newErrors.username = 'Le nom d\'utilisateur est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.first_name.trim()) newErrors.first_name = 'Le prénom est requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Le nom est requis';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Le téléphone est requis';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'La date de naissance est requise';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    if (formData.password.length < 6) newErrors.password = 'Le mot de passe doit avoir au moins 6 caractères';
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Les mots de passe ne correspondent pas';

    if ((userType === 'doctor' || userType === 'receptionist') && !formData.clinic) {
      newErrors.clinic = 'La clinique est requise';
    }

    // Validation pour réceptionniste
    if (userType === 'receptionist') {
      if (!formData.shift_start) newErrors.shift_start = 'L\'heure de début est requise';
      if (!formData.shift_end) newErrors.shift_end = 'L\'heure de fin est requise';
      if (!formData.working_days || formData.working_days.length === 0) {
        newErrors.working_days = 'Au moins un jour de travail est requis';
      }
    }

    // Validation pour patient
    if (userType === 'patient') {
      if (!formData.clinic) newErrors.clinic = 'La clinique est requise';
      if (!formData.gender) newErrors.gender = 'Le genre est requis';
      if (!formData.emergency_contact_name.trim()) newErrors.emergency_contact_name = 'Le nom du contact d\'urgence est requis';
      if (!formData.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = 'Le téléphone du contact d\'urgence est requis';
      if (!formData.emergency_contact_relationship.trim()) newErrors.emergency_contact_relationship = 'La relation avec le contact d\'urgence est requise';
    }

    // Validation pour médecin
    if (userType === 'doctor') {
      if (!formData.specialization.trim()) newErrors.specialization = 'La spécialisation est requise';
      if (!formData.license_number.trim()) newErrors.license_number = 'Le numéro de licence est requis';
      if (!formData.years_of_experience) newErrors.years_of_experience = 'Les années d\'expérience sont requises';
      if (!formData.education.trim()) newErrors.education = 'La formation est requise';
      if (!formData.consultation_fee) newErrors.consultation_fee = 'Le tarif de consultation est requis';
      if (!formData.available_days || formData.available_days.length === 0) {
        newErrors.available_days = 'Au moins un jour de disponibilité est requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Rafraîchir le token avant de faire la requête
      let token = localStorage.getItem('access_token');
      try {
        token = await refreshAccessToken();
      } catch (err) {
        console.log('Token refresh failed, using existing token');
      }

      const payload = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth,
        password: formData.password,
        user_type: userType,
      };

      // Ajouter clinic si nécessaire
      if (userType === 'doctor' || userType === 'receptionist') {
        payload.clinic = parseInt(formData.clinic);
      }

      // Ajouter specialty si c'est un docteur
      if (userType === 'doctor') {
        payload.specialty = parseInt(formData.specialty);
      }

      // Ajouter les champs spécifiques à la réceptionniste
      if (userType === 'receptionist') {
        payload.shift_start = formData.shift_start;
        payload.shift_end = formData.shift_end;
        payload.working_days = formData.working_days;
        payload.permissions = formData.permissions;
        payload.is_active = formData.is_active;
      }

      // Ajouter les champs spécifiques au patient
      if (userType === 'patient') {
        payload.clinic = parseInt(formData.clinic);
        payload.gender = formData.gender;
        payload.blood_type = formData.blood_type || null;
        payload.emergency_contact_name = formData.emergency_contact_name;
        payload.emergency_contact_phone = formData.emergency_contact_phone;
        payload.emergency_contact_relationship = formData.emergency_contact_relationship;
        payload.medical_history = formData.medical_history || '';
        payload.allergies = formData.allergies || '';
        payload.current_medications = formData.current_medications || '';
        payload.insurance_number = formData.insurance_number || '';
        payload.insurance_provider = formData.insurance_provider || '';
      }

      // Ajouter les champs spécifiques au médecin
      if (userType === 'doctor') {
        payload.clinic = parseInt(formData.clinic);
        payload.specialization = formData.specialization;
        payload.license_number = formData.license_number;
        payload.years_of_experience = parseInt(formData.years_of_experience);
        payload.education = formData.education;
        payload.certifications = formData.certifications || '';
        payload.consultation_fee = parseFloat(formData.consultation_fee);
        payload.available_days = formData.available_days;
        payload.available_hours = formData.available_hours;
        payload.is_available = formData.is_available;
      }

      console.log('Payload envoyé:', payload);

      const response = await fetch('http://localhost:8000/api/users/create-user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Réponse status:', response.status);
      const responseData = await response.json();
      console.log('Réponse data:', responseData);

      if (response.ok) {
        setSuccess(`✅ ${userType === 'admin' ? 'Admin' : userType === 'doctor' ? 'Médecin' : userType === 'receptionist' ? 'Réceptionniste' : 'Patient'} créé avec succès!`);
        setFormData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          date_of_birth: '',
          password: '',
          confirm_password: '',
          clinic: '',
          specialty: '',
          shift_start: '08:00',
          shift_end: '17:00',
          working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          permissions: {},
          is_active: true,
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
        setTimeout(() => navigate('/admin/dashboard'), 2000);
      } else {
        setError(responseData.error || responseData.detail || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-container">
      <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
        <FiArrowLeft /> Retour
      </button>

      <div className="create-user-card">
        <h1>➕ Créer un Nouvel Utilisateur</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Sélection du type d'utilisateur */}
          <div className="user-type-selector">
            <label>Type d'utilisateur *</label>
            <div className="type-buttons">
              {['admin', 'receptionist', 'doctor', 'patient'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`type-btn ${userType === type ? 'active' : ''}`}
                  onClick={() => setUserType(type)}
                >
                  {type === 'admin' ? '👨‍💼 Admin' : type === 'receptionist' ? '📞 Réceptionniste' : type === 'doctor' ? '👨‍⚕️ Médecin' : '🤒 Patient'}
                </button>
              ))}
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="form-section">
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                {errors.last_name && <span className="error-message">{errors.last_name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Nom d'utilisateur *</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="jean.dupont"
                    disabled={loading}
                  />
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

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
                    disabled={loading}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
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
                    disabled={loading}
                  />
                </div>
                {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
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
                    disabled={loading}
                  />
                </div>
                {errors.date_of_birth && <span className="error-message">{errors.date_of_birth}</span>}
              </div>
            </div>
          </div>

          {/* Clinique et Spécialité */}
          {(userType === 'doctor' || userType === 'receptionist') && (
            <div className="form-section">
              <h3>Affectation</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clinic">Clinique *</label>
                  <select
                    id="clinic"
                    name="clinic"
                    value={formData.clinic}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">-- Sélectionner une clinique --</option>
                    {clinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                    ))}
                  </select>
                  {errors.clinic && <span className="error-message">{errors.clinic}</span>}
                </div>

                {userType === 'doctor' && (
                  <div className="form-group">
                    <label htmlFor="specialization">Spécialisation *</label>
                    <input
                      type="text"
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="Ex: Cardiologie, Dermatologie..."
                      disabled={loading}
                    />
                    {errors.specialization && <span className="error-message">{errors.specialization}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Horaires et Permissions pour Réceptionniste */}
          {userType === 'receptionist' && (
            <div className="form-section">
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
                    disabled={loading}
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
                    disabled={loading}
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
                        disabled={loading}
                      />
                      {day === 'Monday' ? 'Lundi' : day === 'Tuesday' ? 'Mardi' : day === 'Wednesday' ? 'Mercredi' : day === 'Thursday' ? 'Jeudi' : day === 'Friday' ? 'Vendredi' : day === 'Saturday' ? 'Samedi' : 'Dimanche'}
                    </label>
                  ))}
                </div>
                {errors.working_days && <span className="error-message">{errors.working_days}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="is_active">
                  <input
                    type="checkbox"
                    id="is_active"
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
          {userType === 'patient' && (
            <div className="form-section">
              <h3>Informations Médicales</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Genre *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="O">Autre</option>
                  </select>
                  {errors.gender && <span className="error-message">{errors.gender}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="blood_type">Groupe sanguin</label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleChange}
                    disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                  rows="3"
                />
              </div>
            </div>
          )}

          {/* Contact d'Urgence pour Patient */}
          {userType === 'patient' && (
            <div className="form-section">
              <h3>Contact d'Urgence</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="emergency_contact_name">Nom du contact *</label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Nom complet"
                    disabled={loading}
                  />
                  {errors.emergency_contact_name && <span className="error-message">{errors.emergency_contact_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="emergency_contact_phone">Téléphone du contact *</label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+33 6 XX XX XX XX"
                    disabled={loading}
                  />
                  {errors.emergency_contact_phone && <span className="error-message">{errors.emergency_contact_phone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="emergency_contact_relationship">Relation avec le contact *</label>
                <input
                  type="text"
                  id="emergency_contact_relationship"
                  name="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={handleChange}
                  placeholder="Ex: Mère, Père, Conjoint..."
                  disabled={loading}
                />
                {errors.emergency_contact_relationship && <span className="error-message">{errors.emergency_contact_relationship}</span>}
              </div>
            </div>
          )}

          {/* Assurance pour Patient */}
          {userType === 'patient' && (
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Informations Professionnelles pour Médecin */}
          {userType === 'doctor' && (
            <div className="form-section">
              <h3>Informations Professionnelles</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="specialization">Spécialisation *</label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Ex: Cardiologie, Dermatologie..."
                    disabled={loading}
                  />
                  {errors.specialization && <span className="error-message">{errors.specialization}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="license_number">Numéro de licence *</label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    placeholder="Numéro de licence"
                    disabled={loading}
                  />
                  {errors.license_number && <span className="error-message">{errors.license_number}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="years_of_experience">Années d'expérience *</label>
                  <input
                    type="number"
                    id="years_of_experience"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    placeholder="Nombre d'années"
                    disabled={loading}
                    min="0"
                  />
                  {errors.years_of_experience && <span className="error-message">{errors.years_of_experience}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="consultation_fee">Tarif de consultation (€) *</label>
                  <input
                    type="number"
                    id="consultation_fee"
                    name="consultation_fee"
                    value={formData.consultation_fee}
                    onChange={handleChange}
                    placeholder="Ex: 50.00"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                  {errors.consultation_fee && <span className="error-message">{errors.consultation_fee}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="education">Formation *</label>
                <textarea
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="Décrivez votre formation..."
                  disabled={loading}
                  rows="3"
                />
                {errors.education && <span className="error-message">{errors.education}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="certifications">Certifications</label>
                <textarea
                  id="certifications"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                  placeholder="Décrivez vos certifications..."
                  disabled={loading}
                  rows="3"
                />
              </div>
            </div>
          )}

          {/* Disponibilité pour Médecin */}
          {userType === 'doctor' && (
            <div className="form-section">
              <h3>Disponibilité</h3>

              <div className="form-group">
                <label>Jours de disponibilité *</label>
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
                        disabled={loading}
                      />
                      {day === 'Monday' ? 'Lundi' : day === 'Tuesday' ? 'Mardi' : day === 'Wednesday' ? 'Mercredi' : day === 'Thursday' ? 'Jeudi' : day === 'Friday' ? 'Vendredi' : day === 'Saturday' ? 'Samedi' : 'Dimanche'}
                    </label>
                  ))}
                </div>
                {errors.available_days && <span className="error-message">{errors.available_days}</span>}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  Médecin disponible
                </label>
              </div>
            </div>
          )}

          {/* Mot de passe */}
          <div className="form-section">
            <h3>Sécurité</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Mot de passe *</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirmer le mot de passe *</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
                {errors.confirm_password && <span className="error-message">{errors.confirm_password}</span>}
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/admin/dashboard')} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '⏳ Création...' : '✅ Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;

