import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPrescription } from '../../api/prescriptions';
import { getPatients } from '../../api/patients';
import AlertModal from '../../components/AlertModal';
import '../../styles/Prescriptions.css';

const CreatePrescription = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });

  const [formData, setFormData] = useState({
    patient: '',
    diagnosis: '',
    notes: '',
    status: 'active'
  });

  const [medications, setMedications] = useState([
    {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }
  ]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const addMedication = () => {
    setMedications([...medications, {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patient || !formData.diagnosis) {
      setModalConfig({
        type: 'error',
        title: '❌ Champs requis',
        message: 'Veuillez remplir tous les champs obligatoires'
      });
      setShowModal(true);
      return;
    }

    // Vérifier qu'au moins un médicament est rempli
    const validMedications = medications.filter(med => 
      med.medication_name && med.dosage && med.frequency && med.duration
    );

    if (validMedications.length === 0) {
      setModalConfig({
        type: 'error',
        title: '❌ Médicaments requis',
        message: 'Veuillez ajouter au moins un médicament complet'
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const prescriptionData = {
        ...formData,
        patient: parseInt(formData.patient),
        medications: validMedications
      };

      await createPrescription(prescriptionData);
      
      setModalConfig({
        type: 'success',
        title: ' Ordonnance créée',
        message: 'L\'ordonnance a été créée avec succès'
      });
      setShowModal(true);

      // Rediriger après 1.5 secondes
      setTimeout(() => {
        navigate('/prescriptions');
      }, 1500);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: error.message
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-prescription-container">
      <div className="create-prescription-header">
        <button className="btn-back" onClick={() => navigate('/prescriptions')}>
          ← Retour
        </button>
        <h1>💊 Créer une Ordonnance</h1>
      </div>

      <form onSubmit={handleSubmit} className="prescription-form">
        <div className="form-section">
          <h2>Informations Générales</h2>

          <div className="form-group">
            <label>Patient *</label>
            <select
              name="patient"
              value={formData.patient}
              onChange={handleInputChange}
              required
            >
              <option value="">Sélectionner un patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.user?.first_name} {patient.user?.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Diagnostic *</label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              placeholder="Entrez le diagnostic..."
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Notes et Recommandations</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Recommandations, conseils..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Médicaments</h2>

          {medications.map((medication, index) => (
            <div key={index} className="medication-item">
              <div className="medication-header">
                <h3>Médicament {index + 1}</h3>
                {medications.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-medication"
                    onClick={() => removeMedication(index)}
                  >
                    ✕ Supprimer
                  </button>
                )}
              </div>

              <div className="medication-fields">
                <div className="form-group">
                  <label>Nom du médicament *</label>
                  <input
                    type="text"
                    value={medication.medication_name}
                    onChange={(e) => handleMedicationChange(index, 'medication_name', e.target.value)}
                    placeholder="Ex: Paracétamol"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Dosage *</label>
                  <input
                    type="text"
                    value={medication.dosage}
                    onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    placeholder="Ex: 500mg"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fréquence *</label>
                  <input
                    type="text"
                    value={medication.frequency}
                    onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                    placeholder="Ex: 3 fois par jour"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Durée *</label>
                  <input
                    type="text"
                    value={medication.duration}
                    onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                    placeholder="Ex: 7 jours"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Instructions spéciales</label>
                  <textarea
                    value={medication.instructions}
                    onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                    placeholder="Ex: À prendre après les repas"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-add-medication"
            onClick={addMedication}
          >
            + Ajouter un médicament
          </button>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/prescriptions')}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer l\'ordonnance'}
          </button>
        </div>
      </form>

      <AlertModal
        isOpen={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default CreatePrescription;

