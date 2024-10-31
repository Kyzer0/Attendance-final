from django.db import models
from django.conf import settings

# Student model to store information about students and their relationships with teachers and sections
class Student(models.Model):
    # Student's full name
    name = models.CharField(max_length=100)
    # Unique identifier for student input
    student_input_id = models.CharField(max_length=50, unique=True)
    # Student's email address (must be unique)
    email = models.EmailField(unique=True)
    # Foreign key to link student with their teacher, allows null if teacher is deleted
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='students')
    # Foreign key to link student with their section, allows null if section is deleted
    section = models.ForeignKey('Section', on_delete=models.SET_NULL, null=True)
    # Timestamp for when student record was created
    created_at = models.DateTimeField(auto_now_add=True)

    # String representation of student object returns student's name
    def __str__(self):
        return self.name