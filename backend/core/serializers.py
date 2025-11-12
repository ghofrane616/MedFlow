from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Clinic, Patient, Doctor, Receptionist, Service, Appointment, Message, Conversation


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'inscription des utilisateurs
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    # Champs spécifiques au patient
    clinic = serializers.IntegerField(required=False, write_only=True)
    gender = serializers.CharField(required=False, write_only=True)
    blood_type = serializers.CharField(required=False, allow_blank=True, write_only=True)
    emergency_contact_name = serializers.CharField(required=False, write_only=True)
    emergency_contact_phone = serializers.CharField(required=False, write_only=True)
    emergency_contact_relationship = serializers.CharField(required=False, write_only=True)
    medical_history = serializers.CharField(required=False, allow_blank=True, write_only=True)
    allergies = serializers.CharField(required=False, allow_blank=True, write_only=True)
    current_medications = serializers.CharField(required=False, allow_blank=True, write_only=True)
    insurance_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    insurance_provider = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'user_type', 'phone_number',
            'date_of_birth', 'address',
            # Champs patient
            'clinic', 'gender', 'blood_type', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship',
            'medical_history', 'allergies', 'current_medications',
            'insurance_number', 'insurance_provider'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})

        # Seul "patient" peut s'inscrire via le formulaire public
        user_type = attrs.get('user_type', 'patient')
        if user_type != 'patient':
            raise serializers.ValidationError({
                "user_type": "Seuls les patients peuvent s'inscrire. Les autres comptes sont créés par l'administrateur."
            })

        return attrs

    def create(self, validated_data):
        from .models import Clinic, Patient

        # Extraire les champs patient
        clinic_id = validated_data.pop('clinic', None)
        gender = validated_data.pop('gender', 'O')
        blood_type = validated_data.pop('blood_type', None)
        emergency_contact_name = validated_data.pop('emergency_contact_name', '')
        emergency_contact_phone = validated_data.pop('emergency_contact_phone', '')
        emergency_contact_relationship = validated_data.pop('emergency_contact_relationship', '')
        medical_history = validated_data.pop('medical_history', '')
        allergies = validated_data.pop('allergies', '')
        current_medications = validated_data.pop('current_medications', '')
        insurance_number = validated_data.pop('insurance_number', '')
        insurance_provider = validated_data.pop('insurance_provider', '')

        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')

        # Force user_type à 'patient' pour l'inscription publique
        validated_data['user_type'] = 'patient'

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # Créer automatiquement le profil Patient
        try:
            # Récupérer la clinique sélectionnée ou la première disponible
            if clinic_id:
                try:
                    clinic = Clinic.objects.get(id=clinic_id)
                except Clinic.DoesNotExist:
                    clinic = Clinic.objects.first()
            else:
                clinic = Clinic.objects.first()

            if not clinic:
                clinic = Clinic.objects.create(
                    name="Clinique Par Défaut",
                    address="Adresse par défaut",
                    phone_number="+216 00 000 000",
                    email="clinic@medflow.com"
                )

            Patient.objects.create(
                user=user,
                clinic=clinic,
                patient_id=f"PAT-{user.id}",
                gender=gender,
                blood_type=blood_type or None,
                emergency_contact_name=emergency_contact_name,
                emergency_contact_phone=emergency_contact_phone,
                emergency_contact_relationship=emergency_contact_relationship,
                medical_history=medical_history,
                allergies=allergies,
                current_medications=current_medications,
                insurance_number=insurance_number,
                insurance_provider=insurance_provider
            )
        except Exception as e:
            print(f"Erreur lors de la création du profil patient: {e}")

        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer pour la connexion des utilisateurs
    Accepte soit le username soit l'email
    """
    username = serializers.CharField()  # Peut être username ou email
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')

        if username_or_email and password:
            # Essayer d'abord avec le username
            user = authenticate(username=username_or_email, password=password)

            # Si pas trouvé, essayer avec l'email
            if not user:
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    user = None

            if not user:
                raise serializers.ValidationError('Identifiants invalides.')
            if not user.is_active:
                raise serializers.ValidationError('Compte utilisateur désactivé.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Nom d\'utilisateur/Email et mot de passe requis.')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer pour le profil utilisateur
    """
    receptionist_profile = serializers.SerializerMethodField()
    patient_profile = serializers.SerializerMethodField()
    doctor_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone_number', 'date_of_birth', 'address',
            'date_joined', 'last_login', 'is_active', 'receptionist_profile', 'patient_profile', 'doctor_profile'
        ]
        read_only_fields = ['id', 'username', 'user_type', 'date_joined', 'last_login', 'is_active']

    def get_receptionist_profile(self, obj):
        """Récupère le profil de réceptionniste si disponible"""
        try:
            if obj.user_type == 'receptionist' and hasattr(obj, 'receptionist_profile'):
                receptionist = obj.receptionist_profile
                return {
                    'id': receptionist.id,
                    'employee_id': receptionist.employee_id,
                    'clinic': receptionist.clinic.id,
                    'shift_start': str(receptionist.shift_start),
                    'shift_end': str(receptionist.shift_end),
                    'working_days': receptionist.working_days,
                    'permissions': receptionist.permissions,
                    'services': list(receptionist.services.values_list('id', flat=True)),
                    'is_active': receptionist.is_active,
                    'created_at': receptionist.created_at,
                    'updated_at': receptionist.updated_at,
                }
        except:
            pass
        return None

    def get_patient_profile(self, obj):
        """Récupère le profil de patient si disponible"""
        try:
            if obj.user_type == 'patient' and hasattr(obj, 'patient_profile'):
                patient = obj.patient_profile
                return {
                    'id': patient.id,
                    'patient_id': patient.patient_id,
                    'clinic': patient.clinic.id,
                    'gender': patient.gender,
                    'blood_type': patient.blood_type,
                    'emergency_contact_name': patient.emergency_contact_name,
                    'emergency_contact_phone': patient.emergency_contact_phone,
                    'emergency_contact_relationship': patient.emergency_contact_relationship,
                    'medical_history': patient.medical_history,
                    'allergies': patient.allergies,
                    'current_medications': patient.current_medications,
                    'insurance_number': patient.insurance_number,
                    'insurance_provider': patient.insurance_provider,
                    'is_active': patient.is_active,
                    'created_at': patient.created_at,
                    'updated_at': patient.updated_at,
                }
        except:
            pass
        return None

    def get_doctor_profile(self, obj):
        """Récupère le profil de médecin si disponible"""
        try:
            if obj.user_type == 'doctor' and hasattr(obj, 'doctor_profile'):
                doctor = obj.doctor_profile
                return {
                    'id': doctor.id,
                    'doctor_id': doctor.doctor_id,
                    'clinic': doctor.clinic.id,
                    'specialization': doctor.specialization,
                    'license_number': doctor.license_number,
                    'years_of_experience': doctor.years_of_experience,
                    'education': doctor.education,
                    'certifications': doctor.certifications,
                    'consultation_fee': str(doctor.consultation_fee),
                    'available_days': doctor.available_days,
                    'available_hours': doctor.available_hours,
                    'is_available': doctor.is_available,
                    'is_active': doctor.is_active,
                    'created_at': doctor.created_at,
                    'updated_at': doctor.updated_at,
                }
        except:
            pass
        return None


class ClinicSerializer(serializers.ModelSerializer):
    """
    Serializer pour les cliniques
    """
    class Meta:
        model = Clinic
        fields = '__all__'


class PatientSerializer(serializers.ModelSerializer):
    """
    Serializer pour les patients - Lecture complète
    """
    user = UserProfileSerializer(read_only=True)
    clinic = ClinicSerializer(read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'user_full_name', 'clinic', 'clinic_name', 'patient_id',
            'gender', 'blood_type', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'medical_history', 'allergies',
            'current_medications', 'insurance_number', 'insurance_provider',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'patient_id', 'created_at', 'updated_at']


class PatientCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer et modifier les patients
    """
    class Meta:
        model = Patient
        fields = [
            'clinic', 'gender', 'blood_type', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship',
            'medical_history', 'allergies', 'current_medications',
            'insurance_number', 'insurance_provider', 'is_active'
        ]


class DoctorSerializer(serializers.ModelSerializer):
    """
    Serializer pour les médecins
    """
    user = UserProfileSerializer(read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Doctor
        fields = '__all__'


class ReceptionistSerializer(serializers.ModelSerializer):
    """
    Serializer pour les réceptionnistes
    """
    user = UserProfileSerializer(read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    services = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.all(),
        required=False
    )

    class Meta:
        model = Receptionist
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer pour les services
    """
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'clinic', 'clinic_name', 'name', 'service_type',
            'description', 'duration', 'price', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer pour les rendez-vous - Lecture complète
    """
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True, allow_null=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'clinic', 'clinic_name', 'service', 'service_name',
            'appointment_date', 'duration', 'status', 'reason', 'notes',
            'reminder_sent', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AppointmentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer et modifier les rendez-vous
    """
    duration = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Appointment
        fields = [
            'patient', 'doctor', 'clinic', 'service',
            'appointment_date', 'duration', 'status',
            'reason', 'notes'
        ]

    def validate(self, attrs):
        """Validation personnalisée"""
        from django.utils import timezone
        from datetime import timedelta

        appointment_date = attrs.get('appointment_date')
        doctor = attrs.get('doctor')
        patient = attrs.get('patient')
        service = attrs.get('service')
        duration = attrs.get('duration')

        # Vérifier que la date n'est pas dans le passé
        if appointment_date < timezone.now():
            raise serializers.ValidationError("La date du rendez-vous ne peut pas être dans le passé.")

        # IMPORTANT: Définir la durée à partir du service
        # Toujours utiliser la durée du service si disponible
        if service and hasattr(service, 'duration') and service.duration:
            attrs['duration'] = service.duration
            appointment_duration = service.duration
            print(f"DEBUG validate(): Setting duration from service: {service.duration} minutes for service: {service.name}")
        elif duration:
            appointment_duration = duration
            print(f"DEBUG validate(): Using provided duration: {duration} minutes")
        else:
            attrs['duration'] = 30
            appointment_duration = 30
            print(f"DEBUG validate(): Using default duration: 30 minutes")

        # Calculer l'heure de fin du rendez-vous
        appointment_end = appointment_date + timedelta(minutes=appointment_duration)

        # Vérifier qu'il n'y a pas de conflit avec les rendez-vous existants
        # Un conflit existe si :
        # 1. Le nouveau rendez-vous commence avant la fin d'un rendez-vous existant
        # 2. Le nouveau rendez-vous finit après le début d'un rendez-vous existant
        existing = Appointment.objects.filter(
            doctor=doctor,
            status__in=['scheduled', 'confirmed', 'in_progress']
        ).exclude(id=self.instance.id if self.instance else None)

        for apt in existing:
            apt_end = apt.appointment_date + timedelta(minutes=apt.duration)

            # Vérifier le chevauchement
            if appointment_date < apt_end and appointment_end > apt.appointment_date:
                raise serializers.ValidationError(
                    f"Le médecin a déjà un rendez-vous de {apt.appointment_date.strftime('%H:%M')} "
                    f"à {apt_end.strftime('%H:%M')}. Veuillez choisir un autre créneau."
                )

        return attrs

    def create(self, validated_data):
        """Créer un rendez-vous avec la durée du service"""
        # Si la durée n'est pas fournie, utiliser celle du service
        service = validated_data.get('service')

        # Toujours utiliser la durée du service si disponible
        if service and hasattr(service, 'duration') and service.duration:
            validated_data['duration'] = service.duration
            print(f"DEBUG: Setting duration from service: {service.duration} minutes")
        elif 'duration' not in validated_data or validated_data['duration'] is None:
            validated_data['duration'] = 30  # Durée par défaut
            print(f"DEBUG: Using default duration: 30 minutes")
        else:
            print(f"DEBUG: Using provided duration: {validated_data['duration']} minutes")

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Mettre à jour un rendez-vous avec la durée du service"""
        # Si la durée n'est pas fournie, utiliser celle du service
        if 'duration' not in validated_data or validated_data['duration'] is None:
            service = validated_data.get('service', instance.service)
            if service and service.duration:
                validated_data['duration'] = service.duration

        return super().update(instance, validated_data)


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer pour les messages
    """
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_type = serializers.CharField(source='sender.user_type', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 'sender_type',
            'content', 'is_read', 'read_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'read_at', 'created_at', 'updated_at']


class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer pour les conversations (lecture)
    """
    participants_data = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'clinic', 'subject', 'participants', 'participants_data',
            'is_active', 'last_message', 'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_participants_data(self, obj):
        """Retourne les données des participants"""
        participants = obj.participants.all()
        return [
            {
                'id': p.id,
                'name': p.get_full_name(),
                'email': p.email,
                'user_type': p.user_type
            }
            for p in participants
        ]

    def get_last_message(self, obj):
        """Retourne le dernier message"""
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'id': last_msg.id,
                'sender_name': last_msg.sender.get_full_name(),
                'content': last_msg.content[:100],  # Premiers 100 caractères
                'created_at': last_msg.created_at
            }
        return None

    def get_unread_count(self, obj):
        """Compte les messages non lus"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class ConversationCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer et modifier les conversations
    """
    class Meta:
        model = Conversation
        fields = ['clinic', 'subject', 'participants', 'is_active']

    def validate(self, attrs):
        """Validation personnalisée"""
        participants = attrs.get('participants', [])

        # Vérifier qu'il y a au moins 2 participants
        if len(participants) < 2:
            raise serializers.ValidationError(
                "Une conversation doit avoir au moins 2 participants."
            )

        return attrs
