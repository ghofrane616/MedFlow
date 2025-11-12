from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Clinic, Patient, Doctor, Receptionist

# Register your models here.

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin pour le modèle User personnalisé
    """
    list_display = ['username', 'email', 'first_name', 'last_name', 'user_type', 'is_active']
    list_filter = ['user_type', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']

    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('user_type', 'phone_number', 'date_of_birth', 'address')
        }),
    )


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    """
    Admin pour le modèle Clinic
    """
    list_display = ['name', 'phone_number', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """
    Admin pour le modèle Patient
    """
    list_display = ['patient_id', 'user', 'clinic', 'gender', 'blood_type', 'is_active']
    list_filter = ['gender', 'blood_type', 'is_active', 'clinic']
    search_fields = ['patient_id', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    """
    Admin pour le modèle Doctor
    """
    list_display = ['doctor_id', 'user', 'clinic', 'specialization', 'is_available', 'is_active']
    list_filter = ['specialization', 'is_available', 'is_active', 'clinic']
    search_fields = ['doctor_id', 'user__username', 'user__first_name', 'user__last_name', 'specialization']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    """
    Admin pour le modèle Receptionist
    """
    list_display = ['employee_id', 'user', 'clinic', 'shift_start', 'shift_end', 'is_active']
    list_filter = ['is_active', 'clinic']
    search_fields = ['employee_id', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
