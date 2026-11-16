# MedFlow

Application web de gestion de cliniques médicales : rendez-vous, dossiers patients, ordonnances, messagerie interne et tableaux de bord par rôle.

**Stack :** Django 5 · Django REST Framework · JWT (SimpleJWT) · React 19 · React Router · Chart.js · jsPDF

<!-- Captures d'écran : ajouter ici 2 ou 3 images (tableau de bord, prise de rendez-vous, ordonnance), par ex. docs/screenshots/dashboard.png -->

## Fonctionnalités

| Rôle | Ce qu'il peut faire |
|------|---------------------|
| **Administrateur** | Gérer les cliniques, les services et les comptes (médecins, réceptionnistes, patients) ; réinitialiser un mot de passe, activer/désactiver un compte ; consulter des rapports statistiques |
| **Médecin** | Voir son planning, gérer ses rendez-vous, rédiger et modifier des ordonnances |
| **Réceptionniste** | Gérer les patients de sa clinique et planifier les rendez-vous |
| **Patient** | S'inscrire, prendre rendez-vous, consulter ses ordonnances (export PDF) |

Tous les rôles disposent d'une **messagerie interne** et d'une page de profil.

### Points techniques notables

- **Détection des conflits de rendez-vous** : la durée de chaque rendez-vous est déduite du service choisi (ex. thérapie = 50 min). Un créneau est refusé s'il chevauche un rendez-vous actif du médecin *ou* du patient ; les rendez-vous annulés libèrent le créneau. Voir `AppointmentCreateUpdateSerializer.validate` dans [`backend/core/serializers.py`](backend/core/serializers.py).
- **Authentification JWT** avec rotation des refresh tokens et révocation à la déconnexion (blacklist).
- **Contrôle d'accès par rôle côté API** : l'inscription publique est limitée aux patients ; seuls les administrateurs créent les autres comptes.
- **Configuration par variables d'environnement** (clé secrète, `DEBUG`, hôtes, CORS, URL de l'API).

## Architecture

```
MedFlow/
├── backend/                 API REST Django
│   ├── medflow_project/     configuration (settings, urls)
│   └── core/                modèles, serializers, vues, routes, tests
└── frontend/                application React (Create React App)
    └── src/
        ├── api/             appels à l'API
        ├── components/      composants partagés
        ├── pages/           pages par rôle (admin, doctor, receptionist, patient…)
        └── config.js        URL de l'API
```

Modèles principaux : `User` (avec `user_type`), `Clinic`, `Patient`, `Doctor`, `Receptionist`, `Service`, `Appointment`, `Conversation`, `Message`, `Prescription`, `PrescriptionMedication`.

## Installation

Prérequis : **Python 3.10+** et **Node.js 18+**.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt

cp .env.example .env            # puis renseigner DJANGO_SECRET_KEY
python manage.py migrate
python manage.py createsuperuser
python manage.py shell -c "from core.models import User; User.objects.filter(is_superuser=True).update(user_type='admin')"
python manage.py runserver
```

L'API est disponible sur `http://localhost:8000/api/` et l'administration Django sur `http://localhost:8000/admin/`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env            # facultatif : modifier REACT_APP_API_URL
npm start
```

L'application s'ouvre sur `http://localhost:3000`. Connectez-vous avec le compte administrateur créé ci-dessus, puis créez une clinique, des services et des utilisateurs.

## Tests

```bash
# Backend : règles de chevauchement des rendez-vous, permissions, déconnexion
cd backend
python manage.py test core

# Frontend
cd frontend
npm test
```

Des scénarios de test manuels pour la validation des rendez-vous sont décrits dans [`VALIDATION_RENDEZ_VOUS_TEST.md`](VALIDATION_RENDEZ_VOUS_TEST.md).

## Variables d'environnement

| Fichier | Variable | Rôle |
|---------|----------|------|
| `backend/.env` | `DJANGO_SECRET_KEY` | Clé secrète Django (obligatoire) |
| | `DJANGO_DEBUG` | `True` en développement, `False` par défaut |
| | `DJANGO_ALLOWED_HOSTS` | Hôtes autorisés, séparés par des virgules |
| | `CORS_ALLOWED_ORIGINS` | Origines du frontend autorisées |
| `frontend/.env` | `REACT_APP_API_URL` | URL de base de l'API (défaut : `http://localhost:8000/api`) |

## Auteurs

- [ghofrane616](https://github.com/ghofrane616)

<!-- À compléter : autres membres de l'équipe et rôle de chacun (ex. « backend et API », « interfaces médecin et patient »). -->
