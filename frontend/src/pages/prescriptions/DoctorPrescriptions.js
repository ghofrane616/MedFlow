import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrescriptions, deletePrescription } from '../../api/prescriptions';
import AlertModal from '../../components/AlertModal';
import '../../styles/Prescriptions.css';

const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

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

  const handleDeleteClick = (id) => {
    setPendingDeleteId(id);
    setModalConfig({
      type: 'confirm',
      title: '🗑️ Supprimer l\'ordonnance ?',
      message: 'Êtes-vous sûr de vouloir supprimer cette ordonnance ? Cette action est irréversible.'
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePrescription(pendingDeleteId);
      setPrescriptions(prescriptions.filter(p => p.id !== pendingDeleteId));
      setModalConfig({
        type: 'success',
        title: ' Ordonnance supprimée',
        message: 'L\'ordonnance a été supprimée avec succès'
      });
      setShowModal(true);
      setPendingDeleteId(null);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: error.message
      });
      setShowModal(true);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="prescriptions-container">
      <div className="prescriptions-header">
        <h1>💊 Mes Ordonnances</h1>
        <button 
          className="btn-create-prescription"
          onClick={() => navigate('/prescriptions/create')}
        >
          + Créer une ordonnance
        </button>
      </div>

      <div className="prescriptions-filters">
        <input
          type="text"
          placeholder="🔍 Rechercher un patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Active</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className="no-prescriptions">
          <p>Aucune ordonnance trouvée</p>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {filteredPrescriptions.map(prescription => (
            <div key={prescription.id} className="prescription-card">
              <div className="prescription-card-header">
                <h3>{prescription.patient_name}</h3>
                <span className={`status-badge status-${prescription.status}`}>
                  {prescription.status === 'active' && '✓ Active'}
                  {prescription.status === 'completed' && '✓ Terminée'}
                  {prescription.status === 'cancelled' && '✗ Annulée'}
                </span>
              </div>
              <div className="prescription-card-body">
                <p><strong>Date:</strong> {new Date(prescription.created_at).toLocaleDateString('fr-FR')}</p>
                <p><strong>Diagnostic:</strong> {prescription.diagnosis}</p>
                <p><strong>Médicaments:</strong> {prescription.medications.length}</p>
                {prescription.is_viewed_by_patient && (
                  <p className="viewed-badge">👁️ Vue par le patient</p>
                )}
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
                {!prescription.is_viewed_by_patient && (
                  <>
                    <button 
                      className="btn-edit"
                      onClick={() => navigate(`/prescriptions/${prescription.id}/edit`)}
                    >
                      Modifier
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteClick(prescription.id)}
                    >
                      Supprimer
                    </button>
                  </>
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
        onConfirm={modalConfig.type === 'confirm' ? handleDeleteConfirm : undefined}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
};

export default DoctorPrescriptions;

