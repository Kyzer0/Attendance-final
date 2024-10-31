from django.db import models
from .student import Student
from .section import Section

# Attendance model to track student attendance records
class Attendance(models.Model):
    # Foreign key reference to Student model
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    # Foreign key reference to Section model 
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    # Date of attendance
    date = models.DateField()
    # Status of attendance (e.g. present, absent, etc)
    status = models.CharField(max_length=50)

    # String representation of attendance record
    def __str__(self):
        return f"{self.student.name} - {self.status}"