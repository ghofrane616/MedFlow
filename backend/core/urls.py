from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Créer un router pour les ViewSets
router = DefaultRouter()
router.register(r'clinics', views.ClinicViewSet, basename='clinic')
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'doctors', views.DoctorViewSet, basename='doctor')
router.register(r'receptionists', views.ReceptionistViewSet, basename='receptionist')
router.register(r'services', views.ServiceViewSet, basename='service')
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')

urlpatterns = [
    # Authentification
    path('auth/register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('auth/login/', views.UserLoginView.as_view(), name='user-login'),
    path('auth/logout/', views.logout_view, name='user-logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Profil utilisateur
    path('auth/profile/', views.UserProfileView.as_view(), name='user-profile'),

    # Gestion des utilisateurs
    path('users/create-user/', views.create_user_view, name='create-user'),
    path('users/list/', views.list_users_view, name='list-users'),
    path('users/<int:user_id>/', views.user_detail_view, name='user-detail'),
    path('users/<int:user_id>/reset-password/', views.reset_password_view, name='reset-password'),
    path('users/<int:user_id>/toggle-status/', views.toggle_user_status_view, name='toggle-status'),

    # Patients de la clinique
    path('clinic-patients/', views.list_clinic_patients_view, name='clinic-patients'),

    # Utilisateurs de la clinique (pour la messagerie)
    path('clinic-users/', views.list_clinic_users_view, name='clinic-users'),

    # Router pour les ViewSets
    path('', include(router.urls)),
]
