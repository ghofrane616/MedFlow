/**
 * Page Détail de Conversation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiTrash2 } from 'react-icons/fi';
import {
  getConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  markMessageAsRead,
  deleteConversation
} from '../../api/messaging';
import AlertModal from '../../components/AlertModal';
import './ConversationDetail.css';

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);

      // Marquer les messages non lus comme lus
      const unreadMessages = data.filter(
        msg => !msg.is_read && msg.sender.id !== currentUser.id
      );

      for (const msg of unreadMessages) {
        try {
          await markMessageAsRead(msg.id);
        } catch (error) {
          console.error('Erreur lors du marquage du message comme lu:', error);
        }
      }

      setIsInitialLoad(false);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  }, [conversationId, currentUser.id]);

  const fetchConversationData = useCallback(async () => {
    try {
      const data = await getConversation(conversationId);
      setConversation(data);
      await fetchMessages();
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Impossible de charger la conversation'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    // Réinitialiser le flag quand on change de conversation
    setIsInitialLoad(true);
    fetchConversationData();
    const interval = setInterval(fetchMessages, 3000); // Rafraîchir tous les 3 secondes
    return () => clearInterval(interval);
  }, [conversationId, fetchConversationData, fetchMessages]);

  useEffect(() => {
    // Ne pas scroller au premier chargement
    if (!isInitialLoad) {
      scrollToBottom();
    }
  }, [messages, isInitialLoad]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteConversation = () => {
    setModalConfig({
      type: 'confirm',
      title: '⚠️ Êtes-vous sûr ?',
      message: 'Vous êtes sur le point de supprimer cette conversation. Cette action ne peut pas être annulée.'
    });
    setPendingDeleteId('conversation');
    setShowModal(true);
  };

  const confirmDeleteConversation = async () => {
    try {
      await deleteConversation(conversationId);
      setModalConfig({
        type: 'success',
        title: ' Conversation supprimée',
        message: 'La conversation a été supprimée avec succès'
      });
      setShowModal(true);
      setTimeout(() => {
        navigate('/messaging');
      }, 1500);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Impossible de supprimer la conversation'
      });
      setShowModal(true);
    }
  };



  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const message = await sendMessage(conversationId, newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
      // Scroller vers le bas après l'envoi
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Impossible d\'envoyer le message'
      });
      setShowModal(true);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (messageId) => {
    setPendingDeleteId(messageId);
    setModalConfig({
      type: 'confirm',
      title: '🗑️ Supprimer le message ?',
      message: 'Êtes-vous sûr de vouloir supprimer ce message ?'
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === 'conversation') {
      await confirmDeleteConversation();
    } else {
      try {
        await deleteMessage(pendingDeleteId);
        setMessages(messages.filter(m => m.id !== pendingDeleteId));
        setModalConfig({
          type: 'success',
          title: ' Message supprimé',
          message: 'Le message a été supprimé avec succès'
        });
        setShowModal(true);
        setPendingDeleteId(null);
      } catch (error) {
        setModalConfig({
          type: 'error',
          title: '❌ Erreur',
          message: 'Impossible de supprimer le message'
        });
        setShowModal(true);
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="conversation-detail">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="conversation-detail">
      <div className="conversation-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/messaging')}>
            <FiArrowLeft /> Retour
          </button>
          <div className="header-info">
            {/* Afficher seulement le nom du destinataire (l'autre personne) */}
            <h2>
              {conversation?.participants_data
                ?.filter(p => p.id !== currentUser.id)
                .map(p => p.name)
                .join(', ')}
            </h2>
          </div>
        </div>
        <button
          className="btn-delete-conversation"
          onClick={handleDeleteConversation}
          title="Supprimer la conversation"
        >
          <FiTrash2 /> Supprimer
        </button>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>Aucun message pour le moment</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Convertir les deux en nombres pour une comparaison correcte
            const isSentByMe = Number(msg.sender) === Number(currentUser.id);

            return (
              <div
                key={msg.id}
                className={`message ${isSentByMe ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  <div className="message-header">
                    <strong>{msg.sender_name}</strong>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                  <p className="message-text">{msg.content}</p>
                  {isSentByMe && (
                    <button
                      className="btn-delete-message"
                      onClick={() => handleDeleteClick(msg.id)}
                      title="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Écrivez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="message-input"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn btn-primary"
        >
          <FiSend /> {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>

      <AlertModal
        isOpen={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setShowModal(false)}
        onConfirm={pendingDeleteId ? handleDeleteConfirm : undefined}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default ConversationDetail;

