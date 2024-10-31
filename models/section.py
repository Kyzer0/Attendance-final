from django.db import models
from django.contrib import admin
from django.contrib.auth import get_user_model
from .teacher import Teacher

# Model class representing a section/class that can have a teacher and students
class Section(models.Model):
    # Name of the section
    section_name = models.CharField(max_length=100)
    # Foreign key relationship to Teacher model, allows null if teacher is deleted
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='sections',null=True)
    # Maximum number of students that can be enrolled in this section
    student_capacity = models.IntegerField(default=0)
    
    # String representation of section showing section name and teacher
    def __str__(self):
        return f"{self.section_name} - {self.teacher}"

# Admin configuration for Section model to customize display in Django admin
@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    # Fields to display in the admin list view
    list_display = ('section_name', 'teacher')
    # Fields that can be searched in admin
    search_fields = ('section_name', 'teacher__full_name', 'teacher__email')
