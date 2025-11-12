from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

# Create your models here.

class User(AbstractUser):
    """
    Modèle User personnalisé pour MedFlow
    """
    USER_TYPE_CHOICES = [
        ('admin', 'Administrateur'),
        ('doctor', 'Médecin'),
        ('receptionist', 'Réceptionniste'),
        ('patient', 'Patient'),
    ]

    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='patient',
        verbose_name="Type d'utilisateur"
    )
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        verbose_name="Numéro de téléphone"
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date de naissance"
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Adresse"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"


class Clinic(models.Model):
    """
    Modèle Clinic pour gérer les informations des cliniques
    """
    name = models.CharField(
        max_length=200,
        verbose_name="Nom de la clinique"
    )
    address = models.TextField(verbose_name="Adresse")
    city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Ville"
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Code Postal"
    )
    country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Pays"
    )
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        verbose_name="Numéro de téléphone"
    )
    email = models.EmailField(verbose_name="Email")
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name="Site web"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description"
    )
    opening_hours = models.JSONField(
        default=dict,
        help_text="Horaires d'ouverture au format JSON",
        verbose_name="Horaires d'ouverture"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Clinique"
        verbose_name_plural = "Cliniques"


class Patient(models.Model):
    """
    Modèle Patient avec les informations médicales de base
    """
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
        ('O', 'Autre'),
    ]

    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        verbose_name="Utilisateur"
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='patients',
        verbose_name="Clinique"
    )
    patient_id = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="ID Patient"
    )
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        verbose_name="Genre"
    )
    blood_type = models.CharField(
        max_length=3,
        choices=BLOOD_TYPE_CHOICES,
        blank=True,
        null=True,
        verbose_name="Groupe sanguin"
    )
    emergency_contact_name = models.CharField(
        max_length=100,
        verbose_name="Nom du contact d'urgence"
    )
    emergency_contact_phone = models.CharField(
        max_length=17,
        verbose_name="Téléphone du contact d'urgence"
    )
    emergency_contact_relationship = models.CharField(
        max_length=50,
        verbose_name="Relation avec le contact d'urgence"
    )
    medical_history = models.TextField(
        blank=True,
        null=True,
        verbose_name="Antécédents médicaux"
    )
    allergies = models.TextField(
        blank=True,
        null=True,
        verbose_name="Allergies"
    )
    current_medications = models.TextField(
        blank=True,
        null=True,
        verbose_name="Médicaments actuels"
    )
    insurance_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Numéro d'assurance"
    )
    insurance_provider = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Fournisseur d'assurance"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.patient_id}"

    class Meta:
        verbose_name = "Patient"
        verbose_name_plural = "Patients"


class Doctor(models.Model):
    """
    Modèle Doctor avec spécialités et informations professionnelles
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='doctor_profile',
        verbose_name="Utilisateur"
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='doctors',
        verbose_name="Clinique"
    )
    doctor_id = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="ID Médecin"
    )
    specialization = models.CharField(
        max_length=100,
        verbose_name="Spécialisation"
    )
    license_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Numéro de licence"
    )
    years_of_experience = models.PositiveIntegerField(
        verbose_name="Années d'expérience"
    )
    education = models.TextField(verbose_name="Formation")
    certifications = models.TextField(
        blank=True,
        null=True,
        verbose_name="Certifications"
    )
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Tarif de consultation"
    )
    available_days = models.JSONField(
        default=list,
        help_text="Jours de disponibilité au format JSON",
        verbose_name="Jours disponibles"
    )
    available_hours = models.JSONField(
        default=dict,
        help_text="Heures de disponibilité au format JSON",
        verbose_name="Heures disponibles"
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name="Disponible"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.specialization}"

    class Meta:
        verbose_name = "Médecin"
        verbose_name_plural = "Médecins"


class Receptionist(models.Model):
    """
    Modèle Receptionist pour la gestion de l'accueil
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='receptionist_profile',
        verbose_name="Utilisateur"
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='receptionists',
        verbose_name="Clinique"
    )
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="ID Employé"
    )
    shift_start = models.TimeField(verbose_name="Début de service")
    shift_end = models.TimeField(verbose_name="Fin de service")
    working_days = models.JSONField(
        default=list,
        help_text="Jours de travail au format JSON",
        verbose_name="Jours de travail"
    )
    permissions = models.JSONField(
        default=dict,
        help_text="Permissions spécifiques au format JSON",
        verbose_name="Permissions"
    )
    services = models.ManyToManyField(
        'Service',
        blank=True,
        related_name='receptionists',
        verbose_name="Services gérés"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"{self.user.get_full_name()} - Réceptionniste"

    class Meta:
        verbose_name = "Réceptionniste"
        verbose_name_plural = "Réceptionnistes"


class Service(models.Model):
    """
    Modèle Service pour les types de rendez-vous
    """
    SERVICE_TYPE_CHOICES = [
        ('consultation', 'Consultation'),
        ('checkup', 'Bilan de santé'),
        ('surgery', 'Chirurgie'),
        ('therapy', 'Thérapie'),
        ('vaccination', 'Vaccination'),
        ('dental', 'Dentaire'),
        ('other', 'Autre'),
    ]

    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name="Clinique"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Nom du service"
    )
    service_type = models.CharField(
        max_length=20,
        choices=SERVICE_TYPE_CHOICES,
        default='consultation',
        verbose_name="Type de service"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description"
    )
    duration = models.IntegerField(
        default=30,
        help_text="Durée en minutes",
        verbose_name="Durée"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Prix"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"{self.name} - {self.clinic.name}"

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        unique_together = ('clinic', 'name')


class Appointment(models.Model):
    """
    Modèle Appointment pour la gestion des rendez-vous
    """
    STATUS_CHOICES = [
        ('scheduled', 'Planifié'),
        ('confirmed', 'Confirmé'),
        ('in_progress', 'En cours'),
        ('completed', 'Complété'),
        ('cancelled', 'Annulé'),
        ('no_show', 'Absent'),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name="Patient"
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name="Médecin"
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name="Clinique"
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name="Service"
    )
    appointment_date = models.DateTimeField(
        verbose_name="Date et heure du rendez-vous"
    )
    duration = models.IntegerField(
        default=30,
        help_text="Durée en minutes",
        verbose_name="Durée"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
        verbose_name="Statut"
    )
    reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Raison de la visite"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes"
    )
    reminder_sent = models.BooleanField(
        default=False,
        verbose_name="Rappel envoyé"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"RDV {self.patient.user.get_full_name()} - {self.appointment_date}"

    class Meta:
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous"
        ordering = ['-appointment_date']
        indexes = [
            models.Index(fields=['appointment_date']),
            models.Index(fields=['patient', 'appointment_date']),
            models.Index(fields=['doctor', 'appointment_date']),
        ]


class Conversation(models.Model):
    """
    Modèle Conversation pour les discussions entre utilisateurs
    """
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='conversations',
        verbose_name="Clinique"
    )
    participants = models.ManyToManyField(
        User,
        related_name='conversations',
        verbose_name="Participants"
    )
    hidden_for = models.ManyToManyField(
        User,
        related_name='hidden_conversations',
        blank=True,
        verbose_name="Masquée pour"
    )
    subject = models.CharField(
        max_length=255,
        verbose_name="Sujet"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Active"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"{self.subject} - {self.clinic.name}"

    class Meta:
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['clinic', '-updated_at']),
            models.Index(fields=['is_active']),
        ]


class Message(models.Model):
    """
    Modèle Message pour les messages individuels dans une conversation
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name="Conversation"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name="Expéditeur"
    )
    deleted_for = models.ManyToManyField(
        User,
        related_name='deleted_messages',
        blank=True,
        verbose_name="Supprimé pour"
    )
    content = models.TextField(
        verbose_name="Contenu"
    )
    is_read = models.BooleanField(
        default=False,
        verbose_name="Lu"
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de lecture"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    def __str__(self):
        return f"Message de {self.sender.get_full_name()} - {self.created_at}"

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender']),
            models.Index(fields=['is_read']),
        ]
