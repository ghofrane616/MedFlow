import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiCalendar, FiAlertCircle, FiMapPin } from 'react-icons/fi';
import { register } from '../utils/auth';
import '../styles/Auth.css';

/**
 * Page d'inscription MedFlow
 * Permet aux nouveaux utilisateurs de créer un compte patient complet
 */
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    user_type: 'patient',
    // Champs spécifiques au patient
    clinic: '',
    gender: 'M',
    blood_type: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    insurance_number: '',
    insurance_provider: '',
  });

  const [clinics, setClinics] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/clinics/');
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, clinic: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des cliniques:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Le nom d\'utilisateur est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (formData.password !== formData.password_confirm) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!formData.first_name.trim()) {
      setError('Le prénom est requis');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!formData.phone_number.trim()) {
      setError('Le numéro de téléphone est requis');
      return false;
    }
    if (!formData.date_of_birth) {
      setError('La date de naissance est requise');
      return false;
    }
    if (!formData.gender) {
      setError('Le genre est requis');
      return false;
    }
    if (!formData.emergency_contact_name.trim()) {
      setError('Le nom du contact d\'urgence est requis');
      return false;
    }
    if (!formData.emergency_contact_phone.trim()) {
      setError('Le téléphone du contact d\'urgence est requis');
      return false;
    }
    if (!formData.emergency_contact_relationship.trim()) {
      setError('La relation du contact d\'urgence est requise');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Préparer les données pour l'API avec TOUS les champs
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth,
        address: formData.address || '',
        user_type: formData.user_type,
        // Champs patient
        clinic: parseInt(formData.clinic),
        gender: formData.gender,
        blood_type: formData.blood_type || '',
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        medical_history: formData.medical_history || '',
        allergies: formData.allergies || '',
        current_medications: formData.current_medications || '',
        insurance_number: formData.insurance_number || '',
        insurance_provider: formData.insurance_provider || '',
      };

      // Appel API d'inscription
      const response = await register(registrationData);

      // Redirection vers le dashboard patient
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
      console.error('Erreur d\'inscription:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-large">
        <div className="auth-header">
          <h1>MedFlow</h1>
          <p>Créer un nouveau compte</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Inscription</h2>

          {error && (
            <div className="error-message">
              <FiAlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Prénom <span className="required">*</span></label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                  disabled={loading}
                  autoComplete="given-name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Nom <span className="required">*</span></label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  disabled={loading}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choisissez un nom d'utilisateur"
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Mot de passe <span className="required">*</span></label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 caractères"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password_confirm">Confirmer le mot de passe <span className="required">*</span></label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Confirmez le mot de passe"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Numéro de téléphone <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiPhone className="input-icon" />
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+216 XX XXX XXX"
                disabled={loading}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_of_birth">Date de naissance <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiCalendar className="input-icon" />
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                disabled={loading}
                autoComplete="bday"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Adresse</label>
            <div className="input-wrapper">
              <FiMapPin className="input-icon" />
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Votre adresse complète"
                disabled={loading}
                autoComplete="street-address"
              />
            </div>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#2c3e50' }}>
            📋 Informations Médicales
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clinic">Clinique <span className="required">*</span></label>
              <select
                id="clinic"
                name="clinic"
                value={formData.clinic}
                onChange={handleChange}
                disabled={loading}
                className="form-select"
                required
              >
                <option value="">Sélectionnez une clinique</option>
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="gender">Genre <span className="required">*</span></label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
                className="form-select"
                required
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="O">Autre</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="blood_type">Groupe sanguin</label>
            <select
              id="blood_type"
              name="blood_type"
              value={formData.blood_type}
              onChange={handleChange}
              disabled={loading}
              className="form-select"
            >
              <option value="">Sélectionnez votre groupe sanguin</option>
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

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#2c3e50' }}>
            🚨 Contact d'Urgence
          </h3>

          <div className="form-group">
            <label htmlFor="emergency_contact_name">Nom du contact <span className="required">*</span></label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                placeholder="Nom complet du contact d'urgence"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emergency_contact_phone">Téléphone du contact <span className="required">*</span></label>
              <div className="input-wrapper">
                <FiPhone className="input-icon" />
                <input
                  type="tel"
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="+216 XX XXX XXX"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="emergency_contact_relationship">Relation <span className="required">*</span></label>
              <input
                type="text"
                id="emergency_contact_relationship"
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleChange}
                placeholder="Ex: Père, Mère, Conjoint..."
                disabled={loading}
                required
              />
            </div>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#2c3e50' }}>
            💊 Informations de Santé (Optionnel)
          </h3>

          <div className="form-group">
            <label htmlFor="allergies">Allergies</label>
            <textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="Listez vos allergies (médicaments, aliments, etc.)"
              disabled={loading}
              rows="2"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="current_medications">Médicaments actuels</label>
            <textarea
              id="current_medications"
              name="current_medications"
              value={formData.current_medications}
              onChange={handleChange}
              placeholder="Listez les médicaments que vous prenez actuellement"
              disabled={loading}
              rows="2"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="medical_history">Historique médical</label>
            <textarea
              id="medical_history"
              name="medical_history"
              value={formData.medical_history}
              onChange={handleChange}
              placeholder="Maladies chroniques, opérations passées, etc."
              disabled={loading}
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#2c3e50' }}>
            🏥 Assurance (Optionnel)
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="insurance_provider">Compagnie d'assurance</label>
              <input
                type="text"
                id="insurance_provider"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleChange}
                placeholder="Nom de votre assurance"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="insurance_number">Numéro d'assurance</label>
              <input
                type="text"
                id="insurance_number"
                name="insurance_number"
                value={formData.insurance_number}
                onChange={handleChange}
                placeholder="Votre numéro d'assurance"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Vous avez déjà un compte?{' '}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

