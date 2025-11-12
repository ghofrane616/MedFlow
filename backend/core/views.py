from django.shortcuts import render
from django.db.models import Q
from rest_framework import status, generics, permissions, viewsets, serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import logout
from django.utils import timezone
from .models import User, Clinic, Patient, Doctor, Receptionist, Service, Appointment, Message, Conversation
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    ClinicSerializer, PatientSerializer, PatientCreateUpdateSerializer,
    DoctorSerializer, ReceptionistSerializer, ServiceSerializer,
    AppointmentSerializer, AppointmentCreateUpdateSerializer,
    MessageSerializer, ConversationSerializer, ConversationCreateUpdateSerializer
)

# Create your views here.

class UserRegistrationView(generics.CreateAPIView):
    """
    Vue pour l'inscription des utilisateurs
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Utilisateur créé avec succès'
        }, status=status.HTTP_201_CREATED)


class UserLoginView(TokenObtainPairView):
    """
    Vue pour la connexion des utilisateurs avec JWT
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            serializer = UserLoginSerializer(data=request.data)
            if not serializer.is_valid():
                # Retourner les erreurs de validation
                errors = serializer.errors
                error_message = errors.get('non_field_errors', ['Identifiants invalides'])[0] if 'non_field_errors' in errors else str(errors)
                return Response({
                    'detail': error_message,
                    'errors': errors
                }, status=status.HTTP_400_BAD_REQUEST)

            user = serializer.validated_data['user']

            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)

            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Connexion réussie'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Vue pour la déconnexion des utilisateurs
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                # Si le token ne peut pas être blacklisté, continuer quand même
                pass

        logout(request)
        return Response({
            'message': 'Déconnexion réussie'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        # Même en cas d'erreur, retourner 200 car la déconnexion est effectuée côté client
        return Response({
            'message': 'Déconnexion réussie'
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Vue pour consulter et modifier le profil utilisateur
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# Vues pour les modèles principaux
class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les patients (CRUD complet)
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action in ['create', 'update', 'partial_update']:
            return PatientCreateUpdateSerializer
        return PatientSerializer

    def get_queryset(self):
        """Filtre les patients selon le rôle de l'utilisateur"""
        user = self.request.user

        if user.user_type == 'admin':
            return Patient.objects.all()

        if user.user_type == 'doctor':
            try:
                doctor = Doctor.objects.get(user=user)
                return Patient.objects.filter(clinic=doctor.clinic)
            except Doctor.DoesNotExist:
                return Patient.objects.none()

        if user.user_type == 'receptionist':
            try:
                receptionist = Receptionist.objects.get(user=user)
                return Patient.objects.filter(clinic=receptionist.clinic)
            except Receptionist.DoesNotExist:
                return Patient.objects.none()

        if user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=user)
                return Patient.objects.filter(id=patient.id)
            except Patient.DoesNotExist:
                return Patient.objects.none()

        return Patient.objects.none()

    def perform_create(self, serializer):
        """Crée un patient et l'associe à l'utilisateur"""
        user_id = self.request.data.get('user_id')
        if user_id:
            try:
                user = User.objects.get(id=user_id, user_type='patient')
                serializer.save(user=user)
            except User.DoesNotExist:
                raise serializers.ValidationError("Utilisateur patient non trouvé")
        else:
            raise serializers.ValidationError("user_id est requis")

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Récupère le profil du patient connecté"""
        try:
            patient = Patient.objects.get(user=request.user)
            serializer = self.get_serializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Profil patient non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        """Récupère l'historique médical d'un patient"""
        patient = self.get_object()
        return Response({
            'patient_id': patient.patient_id,
            'medical_history': patient.medical_history,
            'allergies': patient.allergies,
            'current_medications': patient.current_medications,
            'blood_type': patient.blood_type,
        })

    @action(detail=True, methods=['patch'])
    def update_medical_info(self, request, pk=None):
        """Met à jour les informations médicales d'un patient"""
        patient = self.get_object()

        if request.user.user_type == 'patient' and patient.user != request.user:
            return Response(
                {'error': 'Vous n\'avez pas la permission de modifier ce patient'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'medical_history' in request.data:
            patient.medical_history = request.data['medical_history']
        if 'allergies' in request.data:
            patient.allergies = request.data['allergies']
        if 'current_medications' in request.data:
            patient.current_medications = request.data['current_medications']

        patient.save()
        serializer = self.get_serializer(patient)
        return Response(serializer.data)


class DoctorViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les médecins (CRUD complet)
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtre les médecins selon le rôle de l'utilisateur"""
        user = self.request.user

        if user.user_type == 'admin':
            return Doctor.objects.all()

        if user.user_type == 'doctor':
            try:
                doctor = Doctor.objects.get(user=user)
                return Doctor.objects.filter(id=doctor.id)
            except Doctor.DoesNotExist:
                return Doctor.objects.none()

        if user.user_type == 'receptionist':
            try:
                receptionist = Receptionist.objects.get(user=user)
                return Doctor.objects.filter(clinic=receptionist.clinic)
            except Receptionist.DoesNotExist:
                return Doctor.objects.none()

        if user.user_type == 'patient':
            try:
                patient = Patient.objects.get(user=user)
                # Le patient voit tous les médecins de sa clinique
                return Doctor.objects.filter(clinic=patient.clinic)
            except Patient.DoesNotExist:
                return Doctor.objects.none()

        return Doctor.objects.none()

    def perform_create(self, serializer):
        """Crée un médecin"""
        user = self.request.user
        if user.user_type not in ['admin', 'receptionist']:
            raise serializers.ValidationError("Vous n'avez pas la permission de créer un médecin")
        serializer.save()


class ReceptionistViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les réceptionnistes (CRUD complet)
    """
    queryset = Receptionist.objects.all()
    serializer_class = ReceptionistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrer les réceptionnistes selon le rôle"""
        user = self.request.user
        if user.user_type == 'admin':
            return Receptionist.objects.all()

        # Les réceptionnistes voient seulement leur propre profil
        try:
            if user.user_type == 'receptionist':
                receptionist = Receptionist.objects.get(user=user)
                return Receptionist.objects.filter(id=receptionist.id)
        except Receptionist.DoesNotExist:
            return Receptionist.objects.none()

        return Receptionist.objects.none()

    def perform_create(self, serializer):
        """Crée une réceptionniste"""
        user = self.request.user
        if user.user_type not in ['admin', 'receptionist']:
            raise serializers.ValidationError("Vous n'avez pas la permission de créer une réceptionniste")
        serializer.save()

    def perform_update(self, serializer):
        """Met à jour une réceptionniste"""
        user = self.request.user
        if user.user_type not in ['admin', 'receptionist']:
            raise serializers.ValidationError("Vous n'avez pas la permission de modifier une réceptionniste")
        serializer.save()


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des services
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrer les services selon le rôle"""
        user = self.request.user
        if user.user_type == 'admin':
            return Service.objects.all()

        # Autres rôles voient les services de leur clinique
        try:
            if user.user_type == 'doctor':
                doctor = Doctor.objects.get(user=user)
                return Service.objects.filter(clinic=doctor.clinic)
            elif user.user_type == 'receptionist':
                receptionist = Receptionist.objects.get(user=user)
                return Service.objects.filter(clinic=receptionist.clinic)
            elif user.user_type == 'patient':
                patient = Patient.objects.get(user=user)
                return Service.objects.filter(clinic=patient.clinic)
        except (Doctor.DoesNotExist, Receptionist.DoesNotExist, Patient.DoesNotExist):
            return Service.objects.none()

        return Service.objects.none()

    def perform_create(self, serializer):
        """Créer un service"""
        user = self.request.user
        if user.user_type not in ['admin', 'receptionist']:
            raise serializers.ValidationError("Vous n'avez pas la permission de créer un service")
        serializer.save()


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des rendez-vous
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Utiliser le bon serializer selon l'action"""
        if self.action in ['create', 'update', 'partial_update']:
            return AppointmentCreateUpdateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        """Filtrer les rendez-vous selon le rôle"""
        user = self.request.user
        if user.user_type == 'admin':
            return Appointment.objects.all()

        try:
            if user.user_type == 'doctor':
                doctor = Doctor.objects.get(user=user)
                return Appointment.objects.filter(doctor=doctor)
            elif user.user_type == 'receptionist':
                receptionist = Receptionist.objects.get(user=user)
                return Appointment.objects.filter(clinic=receptionist.clinic)
            elif user.user_type == 'patient':
                patient = Patient.objects.get(user=user)
                return Appointment.objects.filter(patient=patient)
        except (Doctor.DoesNotExist, Receptionist.DoesNotExist, Patient.DoesNotExist):
            return Appointment.objects.none()

        return Appointment.objects.none()

    @action(detail=False, methods=['get'])
    def my_appointments(self, request):
        """Récupère mes rendez-vous"""
        user = request.user
        try:
            if user.user_type == 'patient':
                patient = Patient.objects.get(user=user)
                appointments = Appointment.objects.filter(patient=patient)
            elif user.user_type == 'doctor':
                doctor = Doctor.objects.get(user=user)
                appointments = Appointment.objects.filter(doctor=doctor)
            else:
                appointments = Appointment.objects.none()
        except (Patient.DoesNotExist, Doctor.DoesNotExist):
            appointments = Appointment.objects.none()

        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def confirm(self, request, pk=None):
        """Confirmer un rendez-vous"""
        appointment = self.get_object()

        if request.user.user_type not in ['admin', 'receptionist', 'doctor']:
            return Response(
                {'error': 'Vous n\'avez pas la permission de confirmer un rendez-vous'},
                status=status.HTTP_403_FORBIDDEN
            )

        appointment.status = 'confirmed'
        appointment.save()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Annuler un rendez-vous"""
        appointment = self.get_object()

        # Vérifier les permissions
        if request.user.user_type == 'patient':
            if appointment.patient.user != request.user:
                return Response(
                    {'error': 'Vous n\'avez pas la permission d\'annuler ce rendez-vous'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user.user_type not in ['admin', 'receptionist', 'doctor']:
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'annuler un rendez-vous'},
                status=status.HTTP_403_FORBIDDEN
            )

        appointment.status = 'cancelled'
        appointment.save()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Récupère les créneaux disponibles pour un médecin et une date"""
        from datetime import datetime, timedelta
        from django.utils import timezone

        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        service_id = request.query_params.get('service_id')  # Nouveau paramètre optionnel

        if not doctor_id or not date_str:
            return Response(
                {'error': 'doctor_id et date sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            doctor = Doctor.objects.get(id=doctor_id)
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except (Doctor.DoesNotExist, ValueError):
            return Response(
                {'error': 'Médecin ou date invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si le médecin est disponible
        if not doctor.is_available or not doctor.is_active:
            return Response({'slots': []})

        # Obtenir la durée du service si fourni
        requested_duration = 30  # Durée par défaut
        if service_id:
            try:
                service = Service.objects.get(id=service_id)
                requested_duration = service.duration
            except Service.DoesNotExist:
                pass

        # Obtenir les horaires de travail du médecin depuis available_hours
        # Format attendu: {"start": "09:00", "end": "17:00"} ou {"start": "21:00", "end": "23:00"}
        available_hours = doctor.available_hours

        # Valeurs par défaut si available_hours est vide
        if not available_hours or not isinstance(available_hours, dict):
            start_hour = 9
            end_hour = 17
        else:
            try:
                # Parser l'heure de début
                start_time_str = available_hours.get('start', '09:00')
                end_time_str = available_hours.get('end', '17:00')

                start_hour = int(start_time_str.split(':')[0])
                start_minute = int(start_time_str.split(':')[1]) if ':' in start_time_str else 0

                end_hour = int(end_time_str.split(':')[0])
                end_minute = int(end_time_str.split(':')[1]) if ':' in end_time_str else 0
            except (ValueError, AttributeError, IndexError):
                # En cas d'erreur, utiliser les valeurs par défaut
                start_hour = 9
                start_minute = 0
                end_hour = 17
                end_minute = 0

        slots = []
        slot_interval = 30  # Intervalle entre les créneaux (toujours 30 min)

        # Récupérer tous les rendez-vous du docteur pour cette date
        appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date__date=date,
            status__in=['scheduled', 'confirmed', 'in_progress']
        )

        # Générer les créneaux en fonction des horaires du médecin
        current_time = datetime.combine(date, datetime.min.time().replace(hour=start_hour, minute=start_minute if 'start_minute' in locals() else 0))
        end_time = datetime.combine(date, datetime.min.time().replace(hour=end_hour, minute=end_minute if 'end_minute' in locals() else 0))

        while current_time < end_time:
            slot_time = timezone.make_aware(current_time)

            # Vérifier si le créneau est dans le futur
            if slot_time > timezone.now():
                # Calculer la fin du créneau en fonction de la durée demandée
                slot_end = slot_time + timedelta(minutes=requested_duration)

                # Vérifier que le créneau ne dépasse pas les horaires de travail
                if slot_end <= timezone.make_aware(end_time):
                    has_conflict = False

                    # Vérifier s'il y a un chevauchement avec les rendez-vous existants
                    for apt in appointments:
                        apt_end = apt.appointment_date + timedelta(minutes=apt.duration)
                        # Vérifier le chevauchement : le nouveau rendez-vous chevauche si :
                        # - Il commence avant la fin d'un rendez-vous existant ET
                        # - Il se termine après le début d'un rendez-vous existant
                        if slot_time < apt_end and slot_end > apt.appointment_date:
                            has_conflict = True
                            break

                    if not has_conflict:
                        slots.append({
                            'time': slot_time.isoformat(),
                            'available': True
                        })

            # Passer au créneau suivant (30 minutes)
            current_time += timedelta(minutes=slot_interval)

        return Response({'slots': slots})


class ClinicViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des cliniques
    """
    queryset = Clinic.objects.all()
    serializer_class = ClinicSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Permettre l'accès public à la liste des cliniques pour l'inscription
        """
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filtrer les cliniques selon le rôle"""
        # Si l'utilisateur n'est pas authentifié (inscription publique), retourner toutes les cliniques
        if not self.request.user.is_authenticated:
            return Clinic.objects.all()

        user = self.request.user
        if user.user_type == 'admin':
            return Clinic.objects.all()

        # Autres rôles voient leur clinique
        try:
            if user.user_type == 'doctor':
                doctor = Doctor.objects.get(user=user)
                return Clinic.objects.filter(id=doctor.clinic.id)
            elif user.user_type == 'receptionist':
                receptionist = Receptionist.objects.get(user=user)
                return Clinic.objects.filter(id=receptionist.clinic.id)
            elif user.user_type == 'patient':
                patient = Patient.objects.get(user=user)
                return Clinic.objects.filter(id=patient.clinic.id)
        except (Doctor.DoesNotExist, Receptionist.DoesNotExist, Patient.DoesNotExist):
            return Clinic.objects.none()

        return Clinic.objects.none()

    def perform_create(self, serializer):
        """Créer une clinique"""
        user = self.request.user
        if user.user_type != 'admin':
            raise serializers.ValidationError("Seuls les admins peuvent créer une clinique")
        serializer.save()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user_view(request):
    """
    Vue pour créer un nouvel utilisateur (Admin, Réceptionniste, Docteur, Patient)
    Seul l'admin peut créer des utilisateurs
    """
    # Vérifier que l'utilisateur est admin
    if request.user.user_type != 'admin':
        return Response({
            'error': 'Seuls les administrateurs peuvent créer des utilisateurs'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        data = request.data
        user_type = data.get('user_type')

        # Valider le type d'utilisateur
        valid_types = ['admin', 'receptionist', 'doctor', 'patient']
        if user_type not in valid_types:
            return Response({
                'error': f'Type d\'utilisateur invalide. Doit être l\'un de: {", ".join(valid_types)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Valider les champs requis
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'date_of_birth']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'Le champ "{field}" est requis'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'username n'existe pas déjà
        if User.objects.filter(username=data.get('username')).exists():
            return Response({
                'error': 'Ce nom d\'utilisateur existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'email n'existe pas déjà
        if User.objects.filter(email=data.get('email')).exists():
            return Response({
                'error': 'Cet email existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Créer l'utilisateur
        try:
            print(f"DEBUG: Création utilisateur avec data: {data}")
            user = User.objects.create_user(
                username=data.get('username'),
                email=data.get('email'),
                password=data.get('password'),
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                phone_number=data.get('phone_number'),
                date_of_birth=data.get('date_of_birth'),
                user_type=user_type
            )
            print(f"DEBUG: Utilisateur créé: {user}")
        except Exception as e:
            import traceback
            print(f"DEBUG: Erreur création utilisateur: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': f'Erreur lors de la création de l\'utilisateur: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Créer le profil associé selon le type
        if user_type == 'doctor':
            clinic_id = data.get('clinic')
            if not clinic_id:
                user.delete()
                return Response({
                    'error': 'La clinique est requise pour un médecin'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Valider les champs requis du médecin
            specialization = data.get('specialization', '').strip()
            license_number = data.get('license_number', '').strip()
            years_of_experience = data.get('years_of_experience')
            education = data.get('education', '').strip()
            consultation_fee = data.get('consultation_fee')

            if not specialization:
                user.delete()
                return Response({
                    'error': 'La spécialisation est requise pour un médecin'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not license_number:
                user.delete()
                return Response({
                    'error': 'Le numéro de licence est requis pour un médecin'
                }, status=status.HTTP_400_BAD_REQUEST)

            if years_of_experience is None:
                user.delete()
                return Response({
                    'error': 'Les années d\'expérience sont requises pour un médecin'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not education:
                user.delete()
                return Response({
                    'error': 'La formation est requise pour un médecin'
                }, status=status.HTTP_400_BAD_REQUEST)

            if consultation_fee is None:
                user.delete()
                return Response({
                    'error': 'Le tarif de consultation est requis pour un médecin'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                clinic = Clinic.objects.get(id=clinic_id)

                # Générer un doctor_id unique
                import uuid
                doctor_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"

                Doctor.objects.create(
                    user=user,
                    clinic=clinic,
                    doctor_id=doctor_id,
                    specialization=specialization,
                    license_number=license_number,
                    years_of_experience=int(years_of_experience),
                    education=education,
                    certifications=data.get('certifications', '').strip(),
                    consultation_fee=float(consultation_fee),
                    available_days=data.get('available_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
                    available_hours=data.get('available_hours', {'start': '09:00', 'end': '17:00'}),
                    is_available=data.get('is_available', True)
                )
            except Clinic.DoesNotExist:
                user.delete()
                return Response({
                    'error': 'Clinique introuvable'
                }, status=status.HTTP_400_BAD_REQUEST)

        elif user_type == 'receptionist':
            clinic_id = data.get('clinic')
            if not clinic_id:
                user.delete()
                return Response({
                    'error': 'La clinique est requise pour une réceptionniste'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                clinic = Clinic.objects.get(id=clinic_id)
                # Générer un employee_id unique
                import uuid
                employee_id = f"EMP-{uuid.uuid4().hex[:8].upper()}"

                # Créer la réceptionniste avec les données du frontend
                from datetime import time, datetime

                # Convertir les heures du format HH:MM en objet time
                shift_start_str = data.get('shift_start', '08:00')
                shift_end_str = data.get('shift_end', '17:00')

                try:
                    shift_start = datetime.strptime(shift_start_str, '%H:%M').time()
                    shift_end = datetime.strptime(shift_end_str, '%H:%M').time()
                except (ValueError, TypeError):
                    shift_start = time(8, 0)
                    shift_end = time(17, 0)

                Receptionist.objects.create(
                    user=user,
                    clinic=clinic,
                    employee_id=employee_id,
                    shift_start=shift_start,
                    shift_end=shift_end,
                    working_days=data.get('working_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
                    permissions=data.get('permissions', {}),
                    is_active=data.get('is_active', True)
                )
            except Clinic.DoesNotExist:
                user.delete()
                return Response({
                    'error': 'Clinique introuvable'
                }, status=status.HTTP_400_BAD_REQUEST)

        elif user_type == 'patient':
            clinic_id = data.get('clinic')
            if not clinic_id:
                user.delete()
                return Response({
                    'error': 'La clinique est requise pour un patient'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Valider les champs requis
            gender = data.get('gender', '').strip()
            emergency_contact_name = data.get('emergency_contact_name', '').strip()
            emergency_contact_phone = data.get('emergency_contact_phone', '').strip()
            emergency_contact_relationship = data.get('emergency_contact_relationship', '').strip()

            if not gender:
                user.delete()
                return Response({
                    'error': 'Le genre est requis pour un patient'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not emergency_contact_name:
                user.delete()
                return Response({
                    'error': 'Le nom du contact d\'urgence est requis'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not emergency_contact_phone:
                user.delete()
                return Response({
                    'error': 'Le téléphone du contact d\'urgence est requis'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not emergency_contact_relationship:
                user.delete()
                return Response({
                    'error': 'La relation avec le contact d\'urgence est requise'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                clinic = Clinic.objects.get(id=clinic_id)

                # Générer un patient_id unique
                import uuid
                patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"

                # Créer le patient avec les données du frontend
                Patient.objects.create(
                    user=user,
                    clinic=clinic,
                    patient_id=patient_id,
                    gender=gender,
                    blood_type=data.get('blood_type') or None,
                    emergency_contact_name=emergency_contact_name,
                    emergency_contact_phone=emergency_contact_phone,
                    emergency_contact_relationship=emergency_contact_relationship,
                    medical_history=data.get('medical_history', '').strip(),
                    allergies=data.get('allergies', '').strip(),
                    current_medications=data.get('current_medications', '').strip(),
                    insurance_number=data.get('insurance_number', '').strip(),
                    insurance_provider=data.get('insurance_provider', '').strip(),
                )
            except Clinic.DoesNotExist:
                user.delete()
                return Response({
                    'error': 'Clinique introuvable'
                }, status=status.HTTP_400_BAD_REQUEST)

        elif user_type == 'admin':
            # Admin n'a pas de profil spécifique
            pass

        return Response({
            'user': UserProfileSerializer(user).data,
            'message': f'{user_type.capitalize()} créé avec succès'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        print(f"Erreur lors de la création d'utilisateur: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users_view(request):
    """
    Vue pour lister tous les utilisateurs
    Seul l'admin peut voir la liste complète
    """
    # Vérifier que l'utilisateur est admin
    if request.user.user_type != 'admin':
        return Response({
            'error': 'Seuls les administrateurs peuvent voir la liste des utilisateurs'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        # Récupérer le filtre par type d'utilisateur (optionnel)
        user_type_filter = request.query_params.get('user_type', None)

        # Récupérer tous les utilisateurs
        users = User.objects.all().order_by('-created_at')

        # Filtrer par type si spécifié
        if user_type_filter:
            users = users.filter(user_type=user_type_filter)

        # Sérialiser les données
        serializer = UserProfileSerializer(users, many=True)

        return Response({
            'users': serializer.data,
            'count': users.count()
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_detail_view(request, user_id):
    """
    Vue pour récupérer, modifier ou supprimer un utilisateur
    Seul l'admin peut modifier ou supprimer les utilisateurs
    """
    # Vérifier que l'utilisateur est admin
    if request.user.user_type != 'admin':
        return Response({
            'error': 'Seuls les administrateurs peuvent gérer les utilisateurs'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'Utilisateur non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)

    # GET - Récupérer les détails de l'utilisateur
    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # PUT - Modifier l'utilisateur
    elif request.method == 'PUT':
        try:
            data = request.data

            # Mettre à jour les champs autorisés
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                user.email = data['email']
            if 'phone_number' in data:
                user.phone_number = data['phone_number']
            if 'date_of_birth' in data:
                user.date_of_birth = data['date_of_birth']

            user.save()

            # Mettre à jour les champs spécifiques à la réceptionniste
            if user.user_type == 'receptionist':
                try:
                    receptionist = Receptionist.objects.get(user=user)

                    if 'shift_start' in data:
                        from datetime import datetime
                        try:
                            shift_start_str = data['shift_start']
                            receptionist.shift_start = datetime.strptime(shift_start_str, '%H:%M').time()
                        except (ValueError, TypeError):
                            pass

                    if 'shift_end' in data:
                        from datetime import datetime
                        try:
                            shift_end_str = data['shift_end']
                            receptionist.shift_end = datetime.strptime(shift_end_str, '%H:%M').time()
                        except (ValueError, TypeError):
                            pass

                    if 'working_days' in data:
                        receptionist.working_days = data['working_days']

                    if 'permissions' in data:
                        receptionist.permissions = data['permissions']

                    if 'services' in data:
                        # Gérer les services sélectionnés
                        services_ids = data['services']
                        if isinstance(services_ids, list):
                            receptionist.services.set(services_ids)

                    if 'is_active' in data:
                        receptionist.is_active = data['is_active']

                    receptionist.save()
                except Receptionist.DoesNotExist:
                    pass

            # Mettre à jour les champs spécifiques au patient
            if user.user_type == 'patient':
                try:
                    patient = Patient.objects.get(user=user)

                    if 'gender' in data:
                        patient.gender = data['gender']

                    if 'blood_type' in data:
                        patient.blood_type = data['blood_type']

                    if 'emergency_contact_name' in data:
                        patient.emergency_contact_name = data['emergency_contact_name']

                    if 'emergency_contact_phone' in data:
                        patient.emergency_contact_phone = data['emergency_contact_phone']

                    if 'emergency_contact_relationship' in data:
                        patient.emergency_contact_relationship = data['emergency_contact_relationship']

                    if 'medical_history' in data:
                        patient.medical_history = data['medical_history']

                    if 'allergies' in data:
                        patient.allergies = data['allergies']

                    if 'current_medications' in data:
                        patient.current_medications = data['current_medications']

                    if 'insurance_number' in data:
                        patient.insurance_number = data['insurance_number']

                    if 'insurance_provider' in data:
                        patient.insurance_provider = data['insurance_provider']

                    patient.save()
                except Patient.DoesNotExist:
                    pass

            # Mettre à jour les champs spécifiques au médecin
            if user.user_type == 'doctor':
                try:
                    doctor = Doctor.objects.get(user=user)

                    if 'specialization' in data:
                        doctor.specialization = data['specialization']

                    if 'license_number' in data:
                        doctor.license_number = data['license_number']

                    if 'years_of_experience' in data:
                        doctor.years_of_experience = int(data['years_of_experience'])

                    if 'education' in data:
                        doctor.education = data['education']

                    if 'certifications' in data:
                        doctor.certifications = data['certifications']

                    if 'consultation_fee' in data:
                        doctor.consultation_fee = float(data['consultation_fee'])

                    if 'available_days' in data:
                        doctor.available_days = data['available_days']

                    if 'available_hours' in data:
                        doctor.available_hours = data['available_hours']

                    if 'is_available' in data:
                        doctor.is_available = data['is_available']

                    doctor.save()
                except Doctor.DoesNotExist:
                    pass

            serializer = UserProfileSerializer(user)
            return Response({
                'user': serializer.data,
                'message': 'Utilisateur modifié avec succès'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la modification: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    # DELETE - Supprimer l'utilisateur
    elif request.method == 'DELETE':
        try:
            user_id_to_delete = user.id
            user.delete()
            return Response({
                'message': 'Utilisateur supprimé avec succès'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la suppression: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_password_view(request, user_id):
    """
    Vue pour réinitialiser le mot de passe d'un utilisateur
    Génère un mot de passe temporaire
    Seul l'admin peut réinitialiser les mots de passe
    """
    # Vérifier que l'utilisateur est admin
    if request.user.user_type != 'admin':
        return Response({
            'error': 'Seuls les administrateurs peuvent réinitialiser les mots de passe'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'Utilisateur non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        # Générer un mot de passe temporaire
        import string
        import random
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

        # Définir le nouveau mot de passe
        user.set_password(temp_password)
        user.save()

        return Response({
            'message': 'Mot de passe réinitialisé avec succès',
            'temporary_password': temp_password,
            'user_email': user.email,
            'note': 'Partagez ce mot de passe temporaire avec l\'utilisateur. Il devra le changer à la prochaine connexion.'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la réinitialisation: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_status_view(request, user_id):
    """
    Vue pour activer/désactiver un utilisateur
    Seul l'admin peut activer/désactiver les utilisateurs
    """
    # Vérifier que l'utilisateur est admin
    if request.user.user_type != 'admin':
        return Response({
            'error': 'Seuls les administrateurs peuvent gérer le statut des utilisateurs'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'Utilisateur non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        # Basculer le statut is_active
        user.is_active = not user.is_active
        user.save()

        status_text = 'activé' if user.is_active else 'désactivé'

        return Response({
            'message': f'Utilisateur {status_text} avec succès',
            'is_active': user.is_active,
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la modification du statut: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_clinic_patients_view(request):
    """
    Vue pour lister les patients de la clinique de l'utilisateur
    Accessible par: Admin (tous les patients), Réceptionniste (patients de sa clinique), Médecin (patients de sa clinique)
    """
    try:
        user = request.user
        patients = []

        if user.user_type == 'admin':
            # Admin voit tous les patients
            patients = Patient.objects.all().order_by('-created_at')

        elif user.user_type == 'receptionist':
            # Réceptionniste voit les patients de sa clinique
            try:
                receptionist = Receptionist.objects.get(user=user)
                patients = Patient.objects.filter(clinic=receptionist.clinic).order_by('-created_at')
            except Receptionist.DoesNotExist:
                return Response({
                    'error': 'Profil réceptionniste non trouvé'
                }, status=status.HTTP_404_NOT_FOUND)

        elif user.user_type == 'doctor':
            # Médecin voit les patients de sa clinique
            try:
                doctor = Doctor.objects.get(user=user)
                patients = Patient.objects.filter(clinic=doctor.clinic).order_by('-created_at')
            except Doctor.DoesNotExist:
                return Response({
                    'error': 'Profil médecin non trouvé'
                }, status=status.HTTP_404_NOT_FOUND)

        elif user.user_type == 'patient':
            # Patient voit seulement son propre profil
            try:
                patient = Patient.objects.get(user=user)
                patients = Patient.objects.filter(id=patient.id)
            except Patient.DoesNotExist:
                return Response({
                    'error': 'Profil patient non trouvé'
                }, status=status.HTTP_404_NOT_FOUND)

        else:
            return Response({
                'error': 'Type d\'utilisateur non reconnu'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Sérialiser les données
        serializer = PatientSerializer(patients, many=True)

        return Response({
            'patients': serializer.data,
            'count': patients.count()
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_clinic_users_view(request):
    """
    Vue pour lister tous les utilisateurs du système
    Accessible par: Tous les utilisateurs authentifiés

    Utilisé pour la messagerie - permet à tous les utilisateurs de communiquer entre eux
    """
    try:
        user = request.user
        clinic = None

        # Tous les utilisateurs peuvent voir tous les autres utilisateurs
        users = User.objects.all().order_by('-created_at')

        # Récupérer la clinique de l'utilisateur actuel pour information
        try:
            if user.user_type == 'receptionist':
                receptionist = Receptionist.objects.get(user=user)
                clinic = receptionist.clinic
            elif user.user_type == 'doctor':
                doctor = Doctor.objects.get(user=user)
                clinic = doctor.clinic
            elif user.user_type == 'patient':
                patient = Patient.objects.get(user=user)
                clinic = patient.clinic
        except (Receptionist.DoesNotExist, Doctor.DoesNotExist, Patient.DoesNotExist):
            pass  # Pas de clinique pour cet utilisateur

        # Sérialiser les données
        serializer = UserProfileSerializer(users, many=True)

        return Response({
            'users': serializer.data,
            'count': users.count(),
            'clinic': clinic.id if clinic else None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# MESSAGERIE - VIEWSETS
# ============================================================================

class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les conversations
    """
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['clinic', 'is_active']
    search_fields = ['subject']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']

    def get_queryset(self):
        """
        Retourne les conversations de l'utilisateur connecté
        Exclut les conversations masquées par l'utilisateur
        """
        user = self.request.user
        return Conversation.objects.filter(
            participants=user,
            is_active=True
        ).exclude(
            hidden_for=user
        ).distinct().prefetch_related('participants', 'messages')

    def get_serializer_class(self):
        """
        Utilise un serializer différent pour la création/modification
        """
        if self.action in ['create', 'update', 'partial_update']:
            return ConversationCreateUpdateSerializer
        return ConversationSerializer

    def create(self, request, *args, **kwargs):
        """
        Crée une nouvelle conversation ou retourne une conversation existante
        entre les mêmes participants
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Ajouter l'utilisateur actuel aux participants
        participants = list(serializer.validated_data.get('participants', []))
        if request.user not in participants:
            participants.append(request.user)

        # Trier les IDs des participants pour une comparaison cohérente
        participant_ids = sorted([p.id for p in participants])

        # Vérifier s'il existe déjà une conversation avec exactement les mêmes participants
        existing_conversations = Conversation.objects.filter(
            clinic=serializer.validated_data['clinic'],
            is_active=True
        ).prefetch_related('participants')

        for conv in existing_conversations:
            conv_participant_ids = sorted([p.id for p in conv.participants.all()])
            if conv_participant_ids == participant_ids:
                # Conversation existante trouvée, la retourner
                return Response(
                    ConversationSerializer(conv, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )

        # Aucune conversation existante, en créer une nouvelle
        conversation = Conversation.objects.create(
            clinic=serializer.validated_data['clinic'],
            subject=serializer.validated_data['subject'],
            is_active=serializer.validated_data.get('is_active', True)
        )
        conversation.participants.set(participants)

        return Response(
            ConversationSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marque tous les messages de la conversation comme lus
        """
        conversation = self.get_object()

        # Marquer les messages comme lus
        messages = conversation.messages.filter(is_read=False).exclude(sender=request.user)
        for message in messages:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()

        return Response({
            'message': f'{messages.count()} messages marqués comme lus'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        """
        Ajoute un participant à la conversation
        """
        conversation = self.get_object()
        user_id = request.data.get('user_id')

        try:
            user = User.objects.get(id=user_id)
            conversation.participants.add(user)
            return Response({
                'message': f'{user.get_full_name()} a été ajouté à la conversation'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'Utilisateur non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """
        Retire un participant de la conversation
        """
        conversation = self.get_object()
        user_id = request.data.get('user_id')

        try:
            user = User.objects.get(id=user_id)
            conversation.participants.remove(user)
            return Response({
                'message': f'{user.get_full_name()} a été retiré de la conversation'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'Utilisateur non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, *args, **kwargs):
        """
        Masque la conversation pour l'utilisateur au lieu de la supprimer
        Marque aussi tous les messages existants comme supprimés pour cet utilisateur
        """
        conversation = self.get_object()
        user = request.user

        # Ajouter l'utilisateur à la liste des utilisateurs qui ont masqué cette conversation
        conversation.hidden_for.add(user)

        # Marquer tous les messages de cette conversation comme supprimés pour cet utilisateur
        for message in conversation.messages.all():
            message.deleted_for.add(user)

        return Response({
            'message': 'Conversation masquée avec succès'
        }, status=status.HTTP_200_OK)


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les messages
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['conversation', 'is_read']
    search_fields = ['content']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Retourne les messages des conversations de l'utilisateur
        Filtre par conversation si le paramètre est fourni
        Exclut les messages supprimés par l'utilisateur
        """
        user = self.request.user
        queryset = Message.objects.filter(
            conversation__participants=user
        ).exclude(
            deleted_for=user
        ).select_related('sender', 'conversation')

        # Filtrer par conversation si le paramètre est fourni
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Crée un nouveau message
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Ajouter l'utilisateur actuel comme expéditeur
        message = Message.objects.create(
            conversation=serializer.validated_data['conversation'],
            sender=request.user,
            content=serializer.validated_data['content']
        )

        # Mettre à jour la date de modification de la conversation
        conversation = message.conversation
        conversation.save()

        # Restaurer la conversation pour tous les participants qui l'avaient masquée
        # IMPORTANT: On ne touche PAS à deleted_for des messages !
        # Les anciens messages restent supprimés, seul le nouveau message est visible
        for participant in conversation.participants.all():
            conversation.hidden_for.remove(participant)

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marque un message comme lu
        """
        message = self.get_object()

        if message.sender != request.user:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        """
        Supprime un message (seulement l'expéditeur peut le faire)
        """
        message = self.get_object()

        if message.sender != request.user:
            return Response({
                'error': 'Vous ne pouvez supprimer que vos propres messages'
            }, status=status.HTTP_403_FORBIDDEN)

        return super().destroy(request, *args, **kwargs)
