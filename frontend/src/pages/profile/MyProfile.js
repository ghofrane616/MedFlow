import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../../components/AlertModal';
import '../../styles/Profile.css';
import { API_URL } from '../../config';


const MyProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });

  const getAccessToken = () => localStorage.getItem('access_token');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du profil');
      }

      const data = await response.json();
      setUser(data);

      // Si l'utilisateur a déjà une photo, l'afficher
      if (data.profile_picture_url) {
        setPreviewUrl(data.profile_picture_url);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Erreur lors du chargement du profil'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setModalConfig({
          type: 'error',
          title: '❌ Fichier invalide',
          message: 'Veuillez sélectionner une image (JPG, PNG, GIF)'
        });
        setShowModal(true);
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setModalConfig({
          type: 'error',
          title: '❌ Fichier trop volumineux',
          message: 'L\'image ne doit pas dépasser 5MB'
        });
        setShowModal(true);
        return;
      }

      setSelectedFile(file);

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setModalConfig({
        type: 'error',
        title: '❌ Aucune image sélectionnée',
        message: 'Veuillez sélectionner une image avant de l\'enregistrer'
      });
      setShowModal(true);
      return;
    }

    try {
      setUploading(true);
      const token = getAccessToken();

      const formData = new FormData();
      formData.append('profile_picture', selectedFile);

      const response = await fetch(`${API_URL}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data = await response.json();
      setUser(data);
      setSelectedFile(null);

      setModalConfig({
        type: 'success',
        title: '✓ Photo mise à jour',
        message: 'Photo de profil mise à jour avec succès !'
      });
      setShowModal(true);

      // Rafraîchir la page après 1.5 secondes pour mettre à jour la photo partout
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erreur',
        message: 'Erreur lors de l\'upload de la photo'
      });
      setShowModal(true);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <h1>👤 Mon Profil</h1>
      </div>

      <div className="profile-content">
        <div className="profile-picture-section">
          <h2>Photo de Profil</h2>
          
          <div className="profile-picture-preview">
            {previewUrl ? (
              <img src={previewUrl} alt="Profil" className="profile-picture-large" />
            ) : (
              <div className="profile-picture-placeholder">
                <span className="profile-icon">👤</span>
              </div>
            )}
          </div>

          <div className="profile-picture-upload">
            <input
              type="file"
              id="profile-picture-input"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="profile-picture-input" className="btn btn-secondary">
              📁 Choisir une photo
            </label>
            
            {selectedFile && (
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? '⏳ Upload en cours...' : '✓ Enregistrer la photo'}
              </button>
            )}
          </div>

          <p className="upload-info">
            📌 Formats acceptés : JPG, PNG, GIF<br />
            📌 Taille maximale : 5 MB
          </p>
        </div>

        <div className="profile-info-section">
          <h2>Informations Personnelles</h2>

          <div className="info-grid">
            <div className="info-item">
              <label>Nom complet</label>
              <p>{user?.first_name} {user?.last_name}</p>
            </div>

            <div className="info-item">
              <label>Email</label>
              <p>{user?.email}</p>
            </div>

            <div className="info-item">
              <label>Nom d'utilisateur</label>
              <p>{user?.username}</p>
            </div>

            <div className="info-item">
              <label>Type de compte</label>
              <p className="user-type-badge">
                {user?.user_type === 'patient' && '👤 Patient'}
                {user?.user_type === 'doctor' && '👨‍⚕️ Médecin'}
                {user?.user_type === 'receptionist' && '👩‍💼 Réceptionniste'}
                {user?.user_type === 'admin' && '👨‍💼 Administrateur'}
              </p>
            </div>

            {user?.phone_number && (
              <div className="info-item">
                <label>Téléphone</label>
                <p>{user.phone_number}</p>
              </div>
            )}

            {user?.date_of_birth && (
              <div className="info-item">
                <label>Date de naissance</label>
                <p>{new Date(user.date_of_birth).toLocaleDateString('fr-FR')}</p>
              </div>
            )}

            {user?.address && (
              <div className="info-item full-width">
                <label>Adresse</label>
                <p>{user.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour les messages */}
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

export default MyProfile;

