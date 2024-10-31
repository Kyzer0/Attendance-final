from django.db import models
from django.utils import timezone
from .section import Section
from django.conf import settings
from datetime import timedelta 

# Timeline model to manage section timelines created by teachers
class Timeline(models.Model):
    # Foreign key to Section model
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    # Foreign key to User model for the teacher
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='timelines'
    )
    # Start time of the timeline
    start_time = models.DateTimeField(default=timezone.now)
    # Duration of timeline in minutes
    duration = models.IntegerField()
    # Whether timeline is currently active
    is_active = models.BooleanField(default=False)

    # Meta class to specify model options
    class Meta:
        ordering = ['-start_time']

    # Override save method to ensure only one active timeline per section/teacher
    def save(self, *args, **kwargs):
        if self.is_active:
            Timeline.objects.filter(
                section=self.section,
                teacher=self.teacher,
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    # Method to deactivate the timeline
    def deactivate(self):
        self.is_active = False
        self.save()

    # Method to check if timeline is currently active based on start time and duration
    def is_timeline_active(self):
        now = timezone.now()
        if not self.is_active or not self.start_time:
            print(f"Timeline {self.id} inactive: is_active={self.is_active}, start_time={self.start_time}")
            return False
        
        end_time = self.start_time + timedelta(minutes=self.duration)
        is_active = now >= self.start_time and now <= end_time
        
        print(f"Timeline {self.id} status: current={now}, start={self.start_time}, end={end_time}, active={is_active}")
        return is_active

    # Method to get remaining time in seconds for active timeline
    def get_remaining_time(self):
        if not self.is_active:
            return 0
        now = timezone.now()
        end_time = self.start_time + timedelta(minutes=self.duration)
        if now > end_time:
            self.is_active = False
            self.save()
            return 0
        return int((end_time - now).total_seconds())