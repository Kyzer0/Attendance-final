from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from datetime import timedelta
from django.conf import settings
# This file can be left empty or you can keep the imports if needed elsewhere
from .models.section import Section
from .models.student import Student
from .models.attendance import Attendance
from .models.student_submission import StudentSubmission
from .models.teacher import Teacher
from .models.timeline import Timeline

print("All models imported")
#teacher model
class Teacher(AbstractUser):
    teacher_id = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    # ... other fields ...

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['teacher_id', 'username']

#timer model
class Timeline(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Use AUTH_USER_MODEL
    start_time = models.DateTimeField()
    duration = models.IntegerField()
    is_active = models.BooleanField(default=False)

    def is_timeline_active(self):
        now = timezone.now()
        if not self.is_active or not self.start_time:
            return False
        end_time = self.start_time + timedelta(minutes=self.duration)
        return now >= self.start_time and now <= end_time

#timer
class Timeline(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    duration = models.IntegerField()  # Duration in minutes
    is_active = models.BooleanField(default=True)

#section model
class Section(models.Model):
    section_name = models.CharField(max_length=100)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    student_count = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['section_name', 'teacher']
        
    def __str__(self):
        return f"{self.section_name} - {self.teacher.first_name} {self.teacher.last_name}"