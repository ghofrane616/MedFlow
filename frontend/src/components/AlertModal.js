import React, { useEffect } from 'react';
import '../styles/AlertModal.css';

/**
 * Composant Modal Universelle Professionnelle
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture du modal
 * @param {string} props.type - Type de modal: 'success', 'error', 'warning', 'confirm', 'info'
 * @param {string} props.title - Titre du modal
 * @param {string} props.message - Message du modal
 * @param {function} props.onClose - Fonction appelée quand le modal se ferme
 * @param {function} props.onConfirm - Fonction appelée pour confirmation (type='confirm')
 * @param {function} props.onCancel - Fonction appelée pour annulation (type='confirm')
 * @param {number} props.autoCloseDelay - Délai avant fermeture automatique (ms), 0 = pas de fermeture auto
 * @param {string} props.confirmText - Texte du bouton de confirmation (défaut: 'Confirmer')
 * @param {string} props.cancelText - Texte du bouton d'annulation (défaut: 'Annuler')
 * @param {string} props.closeText - Texte du bouton de fermeture (défaut: 'OK')
 */
export default function AlertModal({
  isOpen,
  type = 'info', // 'success', 'error', 'warning', 'confirm', 'info'
  title = 'Notification',
  message = 'Message',
  onClose,
  onConfirm,
  onCancel,
  autoCloseDelay = 0,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  closeText = 'OK'
}) {
  // Configuration des types de modal - Design professionnel
  const typeConfig = {
    success: {
      icon: '✓',
      color: '#10B981',
      lightColor: '#D1FAE5',
      darkColor: '#059669'
    },
    error: {
      icon: '✕',
      color: '#EF4444',
      lightColor: '#FEE2E2',
      darkColor: '#DC2626'
    },
    warning: {
      icon: '!',
      color: '#F59E0B',
      lightColor: '#FEF3C7',
      darkColor: '#D97706'
    },
    confirm: {
      icon: '?',
      color: '#3B82F6',
      lightColor: '#DBEAFE',
      darkColor: '#1D4ED8'
    },
    info: {
      icon: 'i',
      color: '#3B82F6',
      lightColor: '#DBEAFE',
      darkColor: '#1D4ED8'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  // Fermeture automatique
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0 && type !== 'confirm') {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, type, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div
        className="alert-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Circle */}
        <div
          className="alert-modal-icon-wrapper"
          style={{ backgroundColor: config.lightColor }}
        >
          <div
            className="alert-modal-icon"
            style={{ color: config.color }}
          >
            {config.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className="alert-modal-title">{title}</h2>

        {/* Message */}
        <p className="alert-modal-message">{message}</p>

        {/* Buttons */}
        <div className="alert-modal-buttons">
          {type === 'confirm' ? (
            <>
              <button
                className="alert-modal-button alert-modal-button-secondary"
                onClick={handleCancel}
                style={{
                  color: config.color,
                  borderColor: config.color
                }}
              >
                {cancelText}
              </button>
              <button
                className="alert-modal-button alert-modal-button-primary"
                onClick={handleConfirm}
                style={{
                  backgroundColor: config.color,
                  color: 'white'
                }}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              className="alert-modal-button alert-modal-button-primary"
              onClick={onClose}
              style={{
                backgroundColor: config.color,
                color: 'white'
              }}
            >
              {closeText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

