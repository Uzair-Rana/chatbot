# chat/models.py
from django.db import models
from django.utils import timezone

class ChatMessage(models.Model):
    ROLE_CHOICES = [('user','User'), ('assistant','Assistant')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.role}: {self.content[:30]}"

class Doctor(models.Model):
    name = models.CharField(max_length=150)
    specialization = models.CharField(max_length=150, blank=True)  # optional
    address = models.CharField(max_length=300, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    # store symptoms as comma-separated tokens (e.g. "fever,cough,headache")
    # keep lowercase when inserting to make matching simpler
    symptoms = models.TextField(blank=True)
    # store timings as newline-separated lines or JSON-like string (free text)
    timings = models.TextField(blank=True)

    def symptoms_list(self):
        # return cleaned list of symptom tokens
        return [s.strip().lower() for s in (self.symptoms or "").split(",") if s.strip()]

    def timings_list(self):
        return [t.strip() for t in (self.timings or "").splitlines() if t.strip()]

    def __str__(self):
        return f"{self.name} ({self.specialization})"
class Symptom(models.Model):
    name = models.CharField(max_length=100)
    possible_disease = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} → {self.possible_disease}"
