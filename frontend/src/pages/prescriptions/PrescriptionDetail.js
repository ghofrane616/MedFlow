import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPrescription } from '../../api/prescriptions';
import { getUser } from '../../utils/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AlertModal from '../../components/AlertModal';
import '../../styles/Prescriptions.css';

const PrescriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const data = await getPrescription(id);
      setPrescription(data);
    } catch (error) {
      console.error('Erreur:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Erreur lors du chargement de l\'ordonnance'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!prescription) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // En-tête
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('ORDONNANCE MÉDICALE', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' });

    // Informations du médecin
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Médecin Prescripteur', 14, 55);

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Dr. ${prescription.doctor_name}`, 14, 65);
    doc.text(`Spécialité: ${prescription.doctor_specialization}`, 14, 72);
    doc.text(`Tél: ${prescription.doctor_phone || 'N/A'}`, 14, 79);

    // Informations du patient
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Patient', 14, 95);

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Nom: ${prescription.patient_name}`, 14, 105);
    doc.text(`Email: ${prescription.patient_email}`, 14, 112);
    if (prescription.patient_date_of_birth) {
      doc.text(`Date de naissance: ${new Date(prescription.patient_date_of_birth).toLocaleDateString('fr-FR')}`, 14, 119);
    }

    // Diagnostic
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Diagnostic', 14, 135);

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const diagnosisLines = doc.splitTextToSize(prescription.diagnosis, pageWidth - 28);
    doc.text(diagnosisLines, 14, 145);

    // Médicaments
    let yPos = 145 + (diagnosisLines.length * 7) + 10;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Médicaments Prescrits', 14, yPos);

    yPos += 10;

    const medicationsData = prescription.medications.map((med, index) => [
      index + 1,
      med.medication_name,
      med.dosage,
      med.frequency,
      med.duration,
      med.instructions || '-'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Médicament', 'Dosage', 'Fréquence', 'Durée', 'Instructions']],
      body: medicationsData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      styles: { fontSize: 9 }
    });

    // Notes - Utiliser doc.previousAutoTable au lieu de doc.lastAutoTable
    if (prescription.notes) {
      yPos = doc.previousAutoTable ? doc.previousAutoTable.finalY + 15 : yPos + 50;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Notes et Recommandations', 14, yPos);

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      const notesLines = doc.splitTextToSize(prescription.notes, pageWidth - 28);
      doc.text(notesLines, 14, yPos + 10);
    }

    // Signature
    const finalY = doc.internal.pageSize.getHeight() - 40;
    doc.setFontSize(10);
    doc.text(`Signature électronique: Dr. ${prescription.doctor_name}`, pageWidth - 14, finalY, { align: 'right' });
    doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString('fr-FR')}`, pageWidth - 14, finalY + 7, { align: 'right' });

    // Télécharger
    doc.save(`ordonnance_${prescription.id}_${new Date().toISOString().split('T')[0]}.pdf`);

    setModalConfig({
      type: 'success',
      title: '✓ PDF téléchargé',
      message: 'L\'ordonnance a été téléchargée avec succès'
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!prescription) {
    return <div className="error">Ordonnance non trouvée</div>;
  }

  return (
    <div className="prescription-detail-container">
      <div className="prescription-detail-header">
        <button className="btn-back" onClick={() => navigate('/prescriptions')}>
          ← Retour
        </button>
        <h1>💊 Détails de l'Ordonnance</h1>
        <button className="btn-download-pdf" onClick={downloadPDF}>
          📄 Télécharger PDF
        </button>
      </div>

      <div className="prescription-detail-content">
        <div className="detail-section">
          <h2>Informations Générales</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Date de prescription</label>
              <p>{new Date(prescription.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="detail-item">
              <label>Statut</label>
              <p>
                <span className={`status-badge status-${prescription.status}`}>
                  {prescription.status === 'active' && '✓ Active'}
                  {prescription.status === 'completed' && '✓ Terminée'}
                  {prescription.status === 'cancelled' && '✗ Annulée'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Médecin Prescripteur</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Nom</label>
              <p>Dr. {prescription.doctor_name}</p>
            </div>
            <div className="detail-item">
              <label>Spécialité</label>
              <p>{prescription.doctor_specialization}</p>
            </div>
            {prescription.doctor_phone && (
              <div className="detail-item">
                <label>Téléphone</label>
                <p>{prescription.doctor_phone}</p>
              </div>
            )}
          </div>
        </div>

        {user.user_type !== 'patient' && (
          <div className="detail-section">
            <h2>Patient</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Nom</label>
                <p>{prescription.patient_name}</p>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <p>{prescription.patient_email}</p>
              </div>
              {prescription.patient_date_of_birth && (
                <div className="detail-item">
                  <label>Date de naissance</label>
                  <p>{new Date(prescription.patient_date_of_birth).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h2>Diagnostic</h2>
          <p className="diagnosis-text">{prescription.diagnosis}</p>
        </div>

        <div className="detail-section">
          <h2>Médicaments Prescrits ({prescription.medications.length})</h2>
          <div className="medications-list">
            {prescription.medications.map((medication, index) => (
              <div key={medication.id} className="medication-detail-card">
                <h3>{index + 1}. {medication.medication_name}</h3>
                <div className="medication-info">
                  <div className="info-row">
                    <span className="info-label">Dosage:</span>
                    <span className="info-value">{medication.dosage}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fréquence:</span>
                    <span className="info-value">{medication.frequency}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Durée:</span>
                    <span className="info-value">{medication.duration}</span>
                  </div>
                  {medication.instructions && (
                    <div className="info-row">
                      <span className="info-label">Instructions:</span>
                      <span className="info-value">{medication.instructions}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {prescription.notes && (
          <div className="detail-section">
            <h2>Notes et Recommandations</h2>
            <p className="notes-text">{prescription.notes}</p>
          </div>
        )}

        {prescription.is_picked_up && (
          <div className="detail-section picked-up-section">
            <p>✓ Ordonnance récupérée en pharmacie le {new Date(prescription.picked_up_date).toLocaleDateString('fr-FR')}</p>
          </div>
        )}
      </div>

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

export default PrescriptionDetail;

