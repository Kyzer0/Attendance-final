from django.core.management.base import BaseCommand
from django.utils import timezone
from App.models import Timeline
import time
from datetime import timedelta

# Command class for managing timeline closure through Django management commands
class Command(BaseCommand):
    help = 'Closes a timeline after it expires'

    # Add command line argument for timeline ID
    def add_arguments(self, parser):
        parser.add_argument('timeline_id', type=int)

    # Main handler function that processes the timeline closure
    # Gets timeline by ID, calculates end time, and deactivates if expired
    def handle(self, *args, **options):
        try:
            timeline_id = options['timeline_id']
            timeline = Timeline.objects.get(pk=timeline_id)
            
            # Calculate when timeline should end based on start time and duration
            end_time = timeline.start_time + timedelta(minutes=timeline.duration)
            
            # Check if timeline has expired and deactivate if needed
            if timezone.now() >= end_time:
                timeline.deactivate()
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully closed timeline for {timeline.section.section_name}'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Timeline is still active until {end_time}'
                ))
        except Timeline.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Timeline {timeline_id} not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
