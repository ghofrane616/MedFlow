import React, { useState, useEffect } from 'react';
import { getAvailableSlots } from '../api/appointments';
import '../styles/Appointments.css';

export default function AppointmentForm({
  appointment = null,
  doctors = [],
  services = [],
  patients = [],
  clinics = [],
  onSubmit,
  onCancel,
  isLoading = false,
  availableSlots = []
}) {
  const [formData, setFormData] = useState({
    patient: '',
    clinic: '',
    doctor: '',
    service: '',
    appointment_date: '',
    reason: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlotsList, setAvailableSlotsList] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (appointment) {
      const date = new Date(appointment.appointment_date);
      setFormData({
        patient: appointment.patient || '',
        clinic: appointment.clinic || '',
        doctor: appointment.doctor || '',
        service: appointment.service || '',
        appointment_date: appointment.appointment_date,
        reason: appointment.reason || '',
        notes: appointment.notes || ''
      });
      setSelectedDate(date);
      setSelectedTime(date.toTimeString().slice(0, 5));
    }
  }, [appointment]);

  const validateForm = () => {
    const newErrors = {};

    // En édition, clinic et patient ne sont pas modifiables
    if (!appointment) {
      if (!formData.clinic) {
        newErrors.clinic = 'La clinique est requise';
      }

      if (!formData.patient) {
        newErrors.patient = 'Le patient est requis';
      }
    }

    if (!formData.doctor) {
      newErrors.doctor = 'Le médecin est requis';
    }

    if (!selectedDate) {
      newErrors.appointment_date = 'La date est requise';
    }

    // selectedTime peut être une ISO string (du créneau) ou vide
    if (!selectedTime || selectedTime.trim() === '') {
      newErrors.time = 'L\'heure est requise';
    }

    if (!formData.reason || formData.reason.trim() === '') {
      newErrors.reason = 'La raison de la visite est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }

    // Si le docteur change, réinitialiser les créneaux
    if (name === 'doctor') {
      setSelectedTime('');
      setAvailableSlotsList([]);

      // Charger les créneaux si une date est sélectionnée
      if (value && selectedDate) {
        await loadAvailableSlots(value, selectedDate, formData.service);
      }
    }

    // Si le service change, recharger les créneaux
    if (name === 'service') {
      setSelectedTime('');
      setAvailableSlotsList([]);

      // Charger les créneaux si docteur et date sont sélectionnés
      if (formData.doctor && selectedDate) {
        await loadAvailableSlots(formData.doctor, selectedDate, value);
      }
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setAvailableSlotsList([]);

    if (errors.appointment_date) {
      setErrors((prev) => ({
        ...prev,
        appointment_date: ''
      }));
    }

    // Charger les créneaux disponibles si docteur et date sont sélectionnés
    if (formData.doctor && date) {
      await loadAvailableSlots(formData.doctor, date, formData.service);
    }
  };

  const loadAvailableSlots = async (doctorId, date, serviceId = null) => {
    try {
      setLoadingSlots(true);
      const response = await getAvailableSlots(doctorId, date, serviceId);
      if (response.slots) {
        setAvailableSlotsList(response.slots);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      setAvailableSlotsList([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
    if (errors.time) {
      setErrors((prev) => ({
        ...prev,
        time: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Si selectedTime est une ISO string (du créneau), l'utiliser directement
    // Sinon, combiner la date et l'heure
    let appointmentDateTime;

    if (selectedTime.includes('T')) {
      // C'est une ISO string (du créneau disponible)
      appointmentDateTime = selectedTime;
    } else {
      // C'est un format HH:MM (ancien format)
      const [hours, minutes] = selectedTime.split(':');
      const dateObj = new Date(selectedDate);
      dateObj.setHours(parseInt(hours), parseInt(minutes), 0);
      appointmentDateTime = dateObj.toISOString();
    }

    const submitData = {
      ...formData,
      appointment_date: appointmentDateTime
    };

    onSubmit(submitData);
  };

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <fieldset>
        <legend>Informations du Rendez-vous</legend>

        <div className="form-group">
          <label htmlFor="clinic">Clinique *</label>
          <select
            id="clinic"
            name="clinic"
            value={formData.clinic}
            onChange={handleChange}
            className={errors.clinic ? 'error' : ''}
            disabled={isLoading || appointment}
          >
            <option value="">-- Sélectionner une clinique --</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
          {errors.clinic && <span className="error-message">{errors.clinic}</span>}
          {appointment && <small style={{color: '#999'}}>Non modifiable en édition</small>}
        </div>

        <div className="form-group">
          <label htmlFor="patient">Patient *</label>
          <select
            id="patient"
            name="patient"
            value={formData.patient}
            onChange={handleChange}
            className={errors.patient ? 'error' : ''}
            disabled={isLoading || appointment}
          >
            <option value="">-- Sélectionner un patient --</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.user_full_name}
              </option>
            ))}
          </select>
          {errors.patient && <span className="error-message">{errors.patient}</span>}
          {appointment && <small style={{color: '#999'}}>Non modifiable en édition</small>}
        </div>

        <div className="form-group">
          <label htmlFor="doctor">Médecin *</label>
          <select
            id="doctor"
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className={errors.doctor ? 'error' : ''}
            disabled={isLoading}
          >
            <option value="">-- Sélectionner un médecin --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.user_full_name} - {doctor.specialization}
              </option>
            ))}
          </select>
          {errors.doctor && <span className="error-message">{errors.doctor}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="service">Service</label>
          <select
            id="service"
            name="service"
            value={formData.service}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="">-- Sélectionner un service --</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration} min)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reason">Raison de la visite *</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Décrivez la raison de votre visite"
            rows="3"
            className={errors.reason ? 'error' : ''}
            disabled={isLoading}
          />
          {errors.reason && <span className="error-message">{errors.reason}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes supplémentaires</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes additionnelles (optionnel)"
            rows="3"
            disabled={isLoading}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Date et Heure</legend>

        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateChange(new Date(e.target.value))}
            className={errors.appointment_date ? 'error' : ''}
            disabled={isLoading}
          />
          {errors.appointment_date && (
            <span className="error-message">{errors.appointment_date}</span>
          )}
        </div>

        <div className="form-group">
          <label>Créneaux Disponibles *</label>
          {loadingSlots ? (
            <div className="loading-slots">Chargement des créneaux disponibles...</div>
          ) : availableSlotsList.length > 0 ? (
            <div className="slots-grid">
              {availableSlotsList.map((slot, index) => {
                const slotDate = new Date(slot.time);
                const slotTime = slotDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <button
                    key={index}
                    type="button"
                    className={`slot-button ${selectedTime === slot.time ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTime(slot.time);
                      if (errors.time) {
                        setErrors((prev) => ({
                          ...prev,
                          time: ''
                        }));
                      }
                    }}
                    disabled={isLoading}
                  >
                    {slotTime}
                  </button>
                );
              })}
            </div>
          ) : selectedDate && formData.doctor ? (
            <div className="no-slots">
              ❌ Aucun créneau disponible pour cette date
            </div>
          ) : (
            <div className="no-slots">
              📅 Sélectionnez une date et un médecin pour voir les créneaux disponibles
            </div>
          )}
          {errors.time && <span className="error-message">{errors.time}</span>}
        </div>
      </fieldset>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Enregistrement...' : appointment ? 'Modifier' : 'Créer'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

