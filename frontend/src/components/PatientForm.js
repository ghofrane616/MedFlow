import React, { useState, useEffect } from 'react';
import '../styles/Patients.css';

export default function PatientForm({ patient = null, onSubmit, onCancel, isLoading = false }) {
  const [formData, setFormData] = useState({
    clinic: '',
    gender: 'M',
    blood_type: 'O+',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    insurance_number: '',
    insurance_provider: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        clinic: patient.clinic || '',
        gender: patient.gender || 'M',
        blood_type: patient.blood_type || 'O+',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        emergency_contact_relationship: patient.emergency_contact_relationship || '',
        medical_history: patient.medical_history || '',
        allergies: patient.allergies || '',
        current_medications: patient.current_medications || '',
        insurance_number: patient.insurance_number || '',
        insurance_provider: patient.insurance_provider || '',
        is_active: patient.is_active !== undefined ? patient.is_active : true
      });
    }
  }, [patient]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emergency_contact_name.trim()) {
      newErrors.emergency_contact_name = 'Le nom du contact d\'urgence est requis';
    }

    if (!formData.emergency_contact_phone.trim()) {
      newErrors.emergency_contact_phone = 'Le téléphone du contact d\'urgence est requis';
    }

    if (!formData.emergency_contact_relationship.trim()) {
      newErrors.emergency_contact_relationship = 'La relation du contact d\'urgence est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="patient-form-container">
      <h2>{patient ? 'Modifier le Patient' : 'Créer un Nouveau Patient'}</h2>

      <form onSubmit={handleSubmit} className="patient-form">
        {/* Informations Personnelles */}
        <fieldset className="form-section">
          <legend>Informations Personnelles</legend>

          <div className="form-group">
            <label htmlFor="gender">Genre *</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="O">Autre</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="blood_type">Groupe Sanguin</label>
            <select
              id="blood_type"
              name="blood_type"
              value={formData.blood_type}
              onChange={handleChange}
            >
              <option value="">Sélectionner...</option>
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
        </fieldset>

        {/* Contact d'Urgence */}
        <fieldset className="form-section">
          <legend>Contact d'Urgence *</legend>

          <div className="form-group">
            <label htmlFor="emergency_contact_name">Nom *</label>
            <input
              type="text"
              id="emergency_contact_name"
              name="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
              placeholder="Nom du contact"
              className={errors.emergency_contact_name ? 'error' : ''}
            />
            {errors.emergency_contact_name && (
              <span className="error-message">{errors.emergency_contact_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="emergency_contact_phone">Téléphone *</label>
            <input
              type="tel"
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              placeholder="+212612345678"
              className={errors.emergency_contact_phone ? 'error' : ''}
            />
            {errors.emergency_contact_phone && (
              <span className="error-message">{errors.emergency_contact_phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="emergency_contact_relationship">Relation *</label>
            <input
              type="text"
              id="emergency_contact_relationship"
              name="emergency_contact_relationship"
              value={formData.emergency_contact_relationship}
              onChange={handleChange}
              placeholder="Ex: Mère, Père, Frère..."
              className={errors.emergency_contact_relationship ? 'error' : ''}
            />
            {errors.emergency_contact_relationship && (
              <span className="error-message">{errors.emergency_contact_relationship}</span>
            )}
          </div>
        </fieldset>

        {/* Informations Médicales */}
        <fieldset className="form-section">
          <legend>Informations Médicales</legend>

          <div className="form-group">
            <label htmlFor="medical_history">Antécédents Médicaux</label>
            <textarea
              id="medical_history"
              name="medical_history"
              value={formData.medical_history}
              onChange={handleChange}
              placeholder="Décrivez les antécédents médicaux..."
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
              placeholder="Listez les allergies..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="current_medications">Médicaments Actuels</label>
            <textarea
              id="current_medications"
              name="current_medications"
              value={formData.current_medications}
              onChange={handleChange}
              placeholder="Listez les médicaments actuels..."
              rows="3"
            />
          </div>
        </fieldset>

        {/* Assurance */}
        <fieldset className="form-section">
          <legend>Assurance</legend>

          <div className="form-group">
            <label htmlFor="insurance_number">Numéro d'Assurance</label>
            <input
              type="text"
              id="insurance_number"
              name="insurance_number"
              value={formData.insurance_number}
              onChange={handleChange}
              placeholder="Numéro d'assurance"
            />
          </div>

          <div className="form-group">
            <label htmlFor="insurance_provider">Fournisseur d'Assurance</label>
            <input
              type="text"
              id="insurance_provider"
              name="insurance_provider"
              value={formData.insurance_provider}
              onChange={handleChange}
              placeholder="Nom du fournisseur"
            />
          </div>
        </fieldset>

        {/* Statut */}
        <fieldset className="form-section">
          <legend>Statut</legend>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <label htmlFor="is_active">Patient Actif</label>
          </div>
        </fieldset>

        {/* Boutons */}
        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Traitement...' : patient ? 'Modifier' : 'Créer'}
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel} disabled={isLoading}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

