import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { login } from '../utils/auth';
import '../styles/Auth.css';

/**
 * Page de connexion MedFlow
 * Permet aux utilisateurs de se connecter avec leurs identifiants
 */
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation basique
      if (!username.trim() || !password.trim()) {
        setError('Veuillez remplir tous les champs');
        setLoading(false);
        return;
      }

      // Appel API de connexion
      const response = await login(username, password);

      // Redirection selon le rôle
      const userType = response.user.user_type;
      switch (userType) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'receptionist':
          navigate('/receptionist/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
      console.error('Erreur de connexion:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>MedFlow</h1>
          <p>Système de Gestion Médicale</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Connexion</h2>

          {error && (
            <div className="error-message">
              <FiAlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre adresse email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte?{' '}
            <Link to="/register" className="auth-link">
              S'inscrire
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="auth-link">
              Mot de passe oublié?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

