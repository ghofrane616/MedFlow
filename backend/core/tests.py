from datetime import datetime, time, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Appointment, Clinic, Doctor, Patient, Service, User
from .serializers import AppointmentCreateUpdateSerializer


def make_clinic():
    return Clinic.objects.create(
        name="Clinique Test",
        address="1 rue de la Santé",
        phone_number="+21612345678",
        email="clinique@example.com",
    )


def make_doctor(clinic, suffix="1"):
    user = User.objects.create_user(
        username=f"doctor{suffix}", password="pass12345!", user_type="doctor",
        first_name="Doc", last_name=f"Tor{suffix}",
    )
    return Doctor.objects.create(
        user=user, clinic=clinic, doctor_id=f"D{suffix}", specialization="Généraliste",
        license_number=f"LIC{suffix}", years_of_experience=5, education="Faculté de médecine",
        consultation_fee=50,
    )


def make_patient(clinic, suffix="1"):
    user = User.objects.create_user(
        username=f"patient{suffix}", password="pass12345!", user_type="patient",
        first_name="Pat", last_name=f"Ient{suffix}",
    )
    return Patient.objects.create(
        user=user, clinic=clinic, patient_id=f"P{suffix}", gender="F",
        emergency_contact_name="Contact", emergency_contact_phone="+21600000000",
        emergency_contact_relationship="Parent",
    )


def tomorrow_at(hour, minute):
    day = timezone.localdate() + timedelta(days=1)
    return timezone.make_aware(datetime.combine(day, time(hour, minute)))


class AppointmentOverlapTests(TestCase):
    """Règles de chevauchement des rendez-vous (durée du service prise en compte)."""

    def setUp(self):
        self.clinic = make_clinic()
        self.doctor = make_doctor(self.clinic)
        self.patient = make_patient(self.clinic)
        self.therapy = Service.objects.create(clinic=self.clinic, name="Thérapie physique", duration=50)
        self.checkup = Service.objects.create(clinic=self.clinic, name="Bilan complet", duration=60)

    def book(self, start, service, patient=None, doctor=None, instance=None):
        data = {
            "patient": (patient or self.patient).id,
            "doctor": (doctor or self.doctor).id,
            "clinic": self.clinic.id,
            "service": service.id,
            "appointment_date": start.isoformat(),
        }
        return AppointmentCreateUpdateSerializer(instance=instance, data=data, partial=instance is not None)

    def create_existing(self, start, service, **kwargs):
        serializer = self.book(start, service, **kwargs)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        return serializer.save()

    def test_duration_is_taken_from_service(self):
        appointment = self.create_existing(tomorrow_at(13, 30), self.therapy)
        self.assertEqual(appointment.duration, 50)

    def test_overlapping_doctor_appointment_is_rejected(self):
        # 13:30 -> 14:20 existe déjà ; 14:00 -> 15:00 chevauche de 20 minutes.
        self.create_existing(tomorrow_at(13, 30), self.therapy)
        other_patient = make_patient(self.clinic, suffix="2")
        serializer = self.book(tomorrow_at(14, 0), self.checkup, patient=other_patient)
        self.assertFalse(serializer.is_valid())
        self.assertIn("appointment_date", serializer.errors)

    def test_back_to_back_appointments_are_allowed(self):
        self.create_existing(tomorrow_at(13, 30), self.therapy)
        other_patient = make_patient(self.clinic, suffix="2")
        serializer = self.book(tomorrow_at(14, 20), self.checkup, patient=other_patient)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_new_appointment_ending_inside_existing_one_is_rejected(self):
        self.create_existing(tomorrow_at(13, 30), self.therapy)
        other_patient = make_patient(self.clinic, suffix="2")
        serializer = self.book(tomorrow_at(12, 45), self.therapy, patient=other_patient)
        self.assertFalse(serializer.is_valid())

    def test_cancelled_appointment_does_not_block_the_slot(self):
        existing = self.create_existing(tomorrow_at(13, 30), self.therapy)
        Appointment.objects.filter(pk=existing.pk).update(status="cancelled")
        other_patient = make_patient(self.clinic, suffix="2")
        serializer = self.book(tomorrow_at(14, 0), self.checkup, patient=other_patient)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_patient_cannot_have_two_overlapping_appointments_with_different_doctors(self):
        self.create_existing(tomorrow_at(13, 30), self.therapy)
        other_doctor = make_doctor(self.clinic, suffix="2")
        serializer = self.book(tomorrow_at(14, 0), self.checkup, doctor=other_doctor)
        self.assertFalse(serializer.is_valid())
        self.assertIn("appointment_date", serializer.errors)

    def test_updating_an_appointment_does_not_conflict_with_itself(self):
        existing = self.create_existing(tomorrow_at(13, 30), self.therapy)
        serializer = self.book(tomorrow_at(13, 40), self.therapy, instance=existing)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_appointment_in_the_past_is_rejected(self):
        serializer = self.book(timezone.now() - timedelta(hours=1), self.therapy)
        self.assertFalse(serializer.is_valid())


class AuthAndPermissionTests(APITestCase):
    """Contrôles d'accès de l'API."""

    def setUp(self):
        self.clinic = make_clinic()
        self.patient = make_patient(self.clinic)

    def test_endpoints_require_authentication(self):
        response = self.client.get(reverse("appointment-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_public_registration_cannot_create_an_admin(self):
        response = self.client.post(reverse("user-register"), {
            "username": "intrus", "email": "intrus@example.com",
            "password": "Str0ngPass!42", "password_confirm": "Str0ngPass!42",
            "first_name": "In", "last_name": "Trus", "user_type": "admin",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="intrus").exists())

    def test_only_admins_can_create_users(self):
        self.client.force_authenticate(self.patient.user)
        response = self.client.post(reverse("create-user"), {"user_type": "doctor"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_revokes_the_refresh_token(self):
        refresh = RefreshToken.for_user(self.patient.user)
        self.client.force_authenticate(self.patient.user)
        self.client.post(reverse("user-logout"), {"refresh": str(refresh)})
        self.client.force_authenticate(None)
        response = self.client.post(reverse("token-refresh"), {"refresh": str(refresh)})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
