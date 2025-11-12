/**
 * Page Créer une Nouvelle Conversation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiX } from 'react-icons/fi';
import { createConversation } from '../../api/messaging';
import AlertModal from '../../components/AlertModal';
import './NewConversation.css';

const NewConversation = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [clinic, setClinic] = useState('');
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [usersByRole, setUsersByRole] = useState({});
  const [initialMessage, setInitialMessage] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.user_type === 'admin';

  useEffect(() => {
    fetchClinicsAndUsers();
  }, []);

  const fetchClinicsAndUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');

      // Récupérer les cliniques (seulement pour les admins)
      if (isAdmin) {
        const clinicsRes = await fetch('http://localhost:8000/api/clinics/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const clinicsData = await clinicsRes.json();
        setClinics(Array.isArray(clinicsData) ? clinicsData : clinicsData.results || []);
      }

      // Récupérer les utilisateurs de la clinique (nouvel endpoint sécurisé)
      const usersRes = await fetch('http://localhost:8000/api/clinic-users/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!usersRes.ok) {
        throw new Error(`Erreur: ${usersRes.status}`);
      }

      const usersData = await usersRes.json();
      const users = usersData.users || [];
      const clinicId = usersData.clinic;

      // Filtrer l'utilisateur actuel
      const filteredUsers = users.filter(u => u.id !== currentUser.id);
      setAvailableUsers(filteredUsers);

      // Grouper les utilisateurs par rôle
      const grouped = {
        doctors: filteredUsers.filter(u => u.user_type === 'doctor'),
        receptionists: filteredUsers.filter(u => u.user_type === 'receptionist'),
        patients: filteredUsers.filter(u => u.user_type === 'patient'),
        admins: filteredUsers.filter(u => u.user_type === 'admin')
      };
      setUsersByRole(grouped);

      // Définir automatiquement la clinique pour les non-admins
      if (!isAdmin && clinicId) {
        setClinic(clinicId.toString());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Impossible de charger les utilisateurs'
      });
      setShowModal(true);
    }
  };

  const handleRecipientSelect = (e) => {
    const userId = parseInt(e.target.value);
    if (userId && !isNaN(userId)) {
      // Chercher l'utilisateur dans tous les rôles
      let user = null;
      for (const role of ['doctors', 'receptionists', 'patients', 'admins']) {
        if (usersByRole[role]) {
          user = usersByRole[role].find(u => u.id === userId);
          if (user) break;
        }
      }

      if (user) {
        setSelectedRecipient(user);
      }
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Veuillez entrer un sujet'
      });
      setShowModal(true);
      return;
    }

    // Vérifier la clinique seulement pour les admins
    if (isAdmin && !clinic) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Veuillez sélectionner une clinique'
      });
      setShowModal(true);
      return;
    }

    if (!selectedRecipient) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Veuillez sélectionner un destinataire'
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const participantIds = [currentUser.id, selectedRecipient.id];

      const conversation = await createConversation({
        clinic: parseInt(clinic),
        subject: subject,
        participants: participantIds
      });

      // Envoyer le message initial si fourni
      if (initialMessage.trim()) {
        try {
          const { sendMessage } = await import('../../api/messaging');
          await sendMessage(conversation.id, initialMessage);
        } catch (msgError) {
          console.error('Erreur lors de l\'envoi du message initial:', msgError);
        }
      }

      setModalConfig({
        type: 'success',
        title: '✓ Conversation créée',
        message: 'La conversation a été créée avec succès'
      });
      setShowModal(true);

      setTimeout(() => {
        navigate(`/messaging/${conversation.id}`);
      }, 1500);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Impossible de créer la conversation'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-conversation">
      <div className="new-conversation-header">
        <button className="btn-back" onClick={() => navigate('/messaging')}>
          <FiArrowLeft /> Retour
        </button>
        <h1>Nouvelle Conversation</h1>
      </div>

      <form className="new-conversation-form" onSubmit={handleCreateConversation}>
        <div className="form-group">
          <label htmlFor="subject">Sujet *</label>
          <input
            id="subject"
            type="text"
            placeholder="Entrez le sujet de la conversation"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Afficher le champ clinique seulement pour les admins */}
        {isAdmin && (
          <div className="form-group">
            <label htmlFor="clinic">Clinique *</label>
            <select
              id="clinic"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              className="form-input"
            >
              <option value="">Sélectionner une clinique</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="recipient">Destinataire *</label>

          {/* Afficher le destinataire sélectionné */}
          {selectedRecipient && (
            <div className="selected-recipient">
              <span className="recipient-name">
                {selectedRecipient.first_name} {selectedRecipient.last_name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedRecipient(null)}
                className="btn-remove-recipient"
                title="Changer le destinataire"
              >
                <FiX />
              </button>
            </div>
          )}

          {/* Select dropdown pour choisir le destinataire */}
          <select
            id="recipient"
            onChange={handleRecipientSelect}
            className="form-input recipient-select"
            value={selectedRecipient?.id || ''}
          >
            <option value="">Sélectionner un destinataire...</option>

            {/* Médecins */}
            {usersByRole.doctors && usersByRole.doctors.length > 0 && (
              <optgroup label="👨‍⚕️ Médecins">
                {usersByRole.doctors.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </option>
                ))}
              </optgroup>
            )}

            {/* Réceptionnistes */}
            {usersByRole.receptionists && usersByRole.receptionists.length > 0 && (
              <optgroup label="📞 Réceptionnistes">
                {usersByRole.receptionists.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </option>
                ))}
              </optgroup>
            )}

            {/* Patients */}
            {usersByRole.patients && usersByRole.patients.length > 0 && (
              <optgroup label="🏥 Patients">
                {usersByRole.patients.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </option>
                ))}
              </optgroup>
            )}

            {/* Admins - Visible pour tous les utilisateurs */}
            {usersByRole.admins && usersByRole.admins.length > 0 && (
              <optgroup label="👨‍💼 Administrateurs">
                {usersByRole.admins.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Champ de message initial */}
        <div className="form-group">
          <label htmlFor="initialMessage">Message initial (optionnel)</label>
          <textarea
            id="initialMessage"
            placeholder="Entrez votre message initial..."
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            className="form-input form-textarea"
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/messaging')}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Création...' : 'Créer la conversation'}
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

export default NewConversation;

