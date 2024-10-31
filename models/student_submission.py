from django.db import models
from .student import Student
from .section import Section
from .teacher import Teacher  # Add this import

# Model class representing a student's submission
# Contains relationships to Student, Section and Teacher models
# Tracks submission timestamp
class StudentSubmission(models.Model):
    # Foreign key to Student model, deletes submission if student is deleted
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    # Foreign key to Section model with related name for reverse lookup
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='submissions')
    # Automatically set timestamp when submission is created
    timestamp = models.DateTimeField(auto_now_add=True)
    # Optional foreign key to Teacher model for tracking who reviewed submission
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='submissions', null=True, blank=True)  # Add this field

    # String representation of submission showing student name, section and timestamp
    def __str__(self):
        return f"{self.student.name} - {self.section.section_name} - {self.timestamp}"