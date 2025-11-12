import React, { useEffect } from 'react';
import '../styles/SuccessModal.css';

/**
 * Composant Modal de Succès réutilisable
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture du modal
 * @param {string} props.title - Titre du modal (ex: "Rendez-vous créé avec succès")
 * @param {string} props.message - Message du modal
 * @param {function} props.onClose - Fonction appelée quand le modal se ferme
 * @param {number} props.autoCloseDelay - Délai avant fermeture automatique (ms), 0 = pas de fermeture auto
 */
export default function SuccessModal({ 
  isOpen, 
  title = "Succès", 
  message = "Opération réussie", 
  onClose,
  autoCloseDelay = 2000 
}) {
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="success-modal-overlay" onClick={onClose}>
      <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="success-modal-icon">✓</div>
        <h2 className="success-modal-title">{title}</h2>
        <p className="success-modal-message">{message}</p>
        <button 
          className="success-modal-button"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}

