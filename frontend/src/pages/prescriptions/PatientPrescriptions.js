import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrescriptions, markPrescriptionPickedUp } from '../../api/prescriptions';
import AlertModal from '../../components/AlertModal';
import '../../styles/Prescriptions.css';

const PatientPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await getPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      console.error('Erreur:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Erreur lors du chargement des ordonnances'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPickedUp = async (id) => {
    try {
      const updated = await markPrescriptionPickedUp(id);
      setPrescriptions(prescriptions.map(p => p.id === id ? updated : p));
      setModalConfig({
        type: 'success',
        title: '✓ Ordonnance récupérée',
        message: 'L\'ordonnance a été marquée comme récupérée en pharmacie'
      });
      setShowModal(true);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: error.message
      });
      setShowModal(true);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="prescriptions-container">
      <div className="prescriptions-header">
        <h1>💊 Mes Ordonnances</h1>
      </div>

      <div className="prescriptions-filters">
        <input
          type="text"
          placeholder="🔍 Rechercher par médecin ou diagnostic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className="no-prescriptions">
          <p>Aucune ordonnance trouvée</p>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {filteredPrescriptions.map(prescription => (
            <div key={prescription.id} className="prescription-card patient-card">
              <div className="prescription-card-header">
                <h3>Dr. {prescription.doctor_name}</h3>
                <span className={`status-badge status-${prescription.status}`}>
                  {prescription.status === 'active' && '✓ Active'}
                  {prescription.status === 'completed' && '✓ Terminée'}
                  {prescription.status === 'cancelled' && '✗ Annulée'}
                </span>
              </div>
              <div className="prescription-card-body">
                <p><strong>Date:</strong> {new Date(prescription.created_at).toLocaleDateString('fr-FR')}</p>
                <p><strong>Spécialité:</strong> {prescription.doctor_specialization}</p>
                <p><strong>Diagnostic:</strong> {prescription.diagnosis}</p>
                <p><strong>Médicaments:</strong> {prescription.medications.length}</p>
                {prescription.is_picked_up && (
                  <p className="picked-up-badge">
                    ✓ Récupérée le {new Date(prescription.picked_up_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <div className="prescription-card-actions">
                <button 
                  className="btn-view"
                  onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                >
                  Voir détails
                </button>
                <button 
                  className="btn-download"
                  onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                >
                  📄 Télécharger PDF
                </button>
                {!prescription.is_picked_up && (
                  <button 
                    className="btn-mark-picked"
                    onClick={() => handleMarkPickedUp(prescription.id)}
                  >
                    ✓ Marquer comme récupérée
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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

export default PatientPrescriptions;

