import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPrescription, updatePrescription } from '../../api/prescriptions';
import { getPatients } from '../../api/patients';
import { getUser } from '../../utils/auth';
import AlertModal from '../../components/AlertModal';
import '../../styles/Prescriptions.css';

const EditPrescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  const [formData, setFormData] = useState({
    patient: '',
    diagnosis: '',
    notes: '',
    medications: []
  });

  useEffect(() => {
    // Vérifier que l'utilisateur est bien un médecin
    if (user?.user_type !== 'doctor') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [id, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prescriptionData, patientsData] = await Promise.all([
        getPrescription(id),
        getPatients()
      ]);

      // Vérifier si l'ordonnance a déjà été vue par le patient
      if (prescriptionData.is_viewed_by_patient) {
        setModalConfig({
          type: 'error',
          title: '❌ Modification impossible',
          message: 'Cette ordonnance a déjà été vue par le patient et ne peut plus être modifiée.',
          onClose: () => navigate('/prescriptions')
        });
        setShowModal(true);
        return;
      }

      setFormData({
        patient: prescriptionData.patient,
        diagnosis: prescriptionData.diagnosis,
        notes: prescriptionData.notes || '',
        medications: prescriptionData.medications.map(med => ({
          medication_name: med.medication_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || ''
        }))
      });

      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error('Erreur:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Erreur lors du chargement de l\'ordonnance',
        onClose: () => navigate('/prescriptions')
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patient || !formData.diagnosis || formData.medications.length === 0) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Veuillez remplir tous les champs obligatoires et ajouter au moins un médicament'
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      await updatePrescription(id, formData);
      setModalConfig({
        type: 'success',
        title: ' Ordonnance modifiée',
        message: 'L\'ordonnance a été modifiée avec succès',
        onClose: () => navigate('/prescriptions')
      });
      setShowModal(true);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la modification de l\'ordonnance';
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: errorMessage
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications];
    newMedications[index][field] = value;
    setFormData({ ...formData, medications: newMedications });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const removeMedication = (index) => {
    const newMedications = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: newMedications });
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="prescription-create-container">
      <div className="prescription-create-header">
        <h1>✏️ Modifier l'ordonnance</h1>
        <button className="btn-back" onClick={() => navigate('/prescriptions')}>
          ← Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="prescription-form">
        {/* Patient */}
        <div className="form-group">
          <label>Patient *</label>
          <select
            value={formData.patient}
            onChange={(e) => setFormData({ ...formData, patient: parseInt(e.target.value) })}
            required
            disabled
          >
            <option value="">Sélectionner un patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.user.first_name} {patient.user.last_name}
              </option>
            ))}
          </select>
          <small className="form-hint">Le patient ne peut pas être modifié</small>
        </div>

        {/* Diagnostic */}
        <div className="form-group">
          <label>Diagnostic *</label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="Entrez le diagnostic"
            rows="3"
            required
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label>Notes et Recommandations</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes supplémentaires, recommandations..."
            rows="4"
          />
        </div>

        {/* Médicaments */}
        <div className="medications-section">
          <div className="medications-header">
            <h3>💊 Médicaments *</h3>
            <button type="button" className="btn-add-medication" onClick={addMedication}>
              + Ajouter un médicament
            </button>
          </div>

          {formData.medications.map((medication, index) => (
            <div key={index} className="medication-card">
              <div className="medication-card-header">
                <h4>Médicament {index + 1}</h4>
                {formData.medications.length > 1 && (
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
                  <label>Instructions</label>
                  <textarea
                    value={medication.instructions}
                    onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                    placeholder="Instructions supplémentaires..."
                    rows="2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/prescriptions')}>
            Annuler
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Modification...' : '✓ Modifier l\'ordonnance'}
          </button>
        </div>
      </form>

      {showModal && (
        <AlertModal
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={() => {
            setShowModal(false);
            if (modalConfig.onClose) {
              modalConfig.onClose();
            }
          }}
        />
      )}
    </div>
  );
};

export default EditPrescription;

