from django.core.management.base import BaseCommand
from django.utils import timezone
from App.models import Timeline

# Command class that handles closing expired timelines
class Command(BaseCommand):
    help = 'Closes expired timelines'

    # Handles the command execution by finding and closing expired timelines
    # Args:
    #   *args: Variable length argument list
    #   **options: Arbitrary keyword arguments
    # Returns:
    #   None
    def handle(self, *args, **options):
        # Get all timelines that have expired but are still open
        expired_timelines = Timeline.objects.filter(end_time__lte=timezone.now(), is_open=True)
        # Update all expired timelines to closed status and get count
        closed_count = expired_timelines.update(is_open=False)
        # Output success message with number of timelines closed
        self.stdout.write(self.style.SUCCESS(f'Successfully closed {closed_count} expired timelines'))
