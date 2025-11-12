/**
 * Page Messagerie - Liste des conversations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiSearch, FiPlus } from 'react-icons/fi';
import { getConversations, markConversationAsRead } from '../../api/messaging';
import AlertModal from '../../components/AlertModal';
import './Messaging.css';

const MessagingPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Impossible de charger les conversations'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = async (conversationId) => {
    try {
      await markConversationAsRead(conversationId);
      navigate(`/messaging/${conversationId}`);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleNewConversation = () => {
    navigate('/messaging/new');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="messaging-container">
        <div className="loading">Chargement des conversations...</div>
      </div>
    );
  }

  return (
    <div className="messaging-container">
      <div className="messaging-header">
        <div className="header-title">
          <FiMessageSquare className="header-icon" />
          <h1>Messagerie</h1>
        </div>
      </div>

      <div className="messaging-search">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher une conversation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="conversations-list">
        {filteredConversations.length === 0 ? (
          <div className="empty-state">
            <FiMessageSquare className="empty-icon" />
            <p>Aucune conversation</p>
            <button className="btn btn-primary" onClick={handleNewConversation}>
              Démarrer une conversation
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.unread_count > 0 ? 'unread' : ''}`}
              onClick={() => handleConversationClick(conv.id)}
            >
              <div className="conversation-content">
                <div className="conversation-header">
                  <h3 className="conversation-subject">{conv.subject}</h3>
                  <span className="conversation-date">
                    {formatDate(conv.updated_at)}
                  </span>
                </div>
                <p className="conversation-preview">
                  {conv.last_message?.content || 'Aucun message'}
                </p>
                <div className="conversation-participants">
                  {/* Afficher seulement le nom du destinataire (l'autre personne) */}
                  {conv.participants_data
                    ?.filter(p => p.id !== (JSON.parse(localStorage.getItem('user'))?.id || null))
                    .map((p) => (
                      <span key={p.id} className="participant-badge">
                        {p.name}
                      </span>
                    ))}
                </div>
              </div>
              {conv.unread_count > 0 && (
                <div className="unread-badge">{conv.unread_count}</div>
              )}
            </div>
          ))
        )}
      </div>

      <AlertModal
        isOpen={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setShowModal(false)}
      />

      {/* Bouton flottant pour créer une nouvelle conversation */}
      <button
        className="btn-floating-new-conversation"
        onClick={handleNewConversation}
        title="Nouvelle conversation"
      >
        <FiPlus />
      </button>
    </div>
  );
};

export default MessagingPage;

