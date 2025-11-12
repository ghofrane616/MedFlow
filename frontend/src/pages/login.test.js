import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './login';
import * as authUtils from '../utils/auth';

// Mock les utilitaires d'authentification
jest.mock('../utils/auth');

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le formulaire de connexion', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Entrez votre mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  test('affiche un message d\'erreur si les champs sont vides', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Se connecter/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Veuillez remplir tous les champs')).toBeInTheDocument();
    });
  });

  test('appelle la fonction login avec les bonnes données', async () => {
    authUtils.login.mockResolvedValue({
      user: { user_type: 'patient', username: 'testuser' },
      access: 'token',
      refresh: 'refresh_token',
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur');
    const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe');
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authUtils.login).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  test('affiche un message d\'erreur en cas d\'échec de connexion', async () => {
    authUtils.login.mockRejectedValue(new Error('Identifiants invalides'));

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur');
    const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe');
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument();
    });
  });

  test('affiche les identifiants de démonstration', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Identifiants de démonstration:')).toBeInTheDocument();
    expect(screen.getByText(/admin \/ admin123/)).toBeInTheDocument();
  });

  test('affiche un lien vers la page d\'inscription', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const registerLink = screen.getByRole('link', { name: /S'inscrire/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});

