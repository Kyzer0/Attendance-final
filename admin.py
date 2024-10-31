from django.contrib import admin
from .models import Timeline 
from django.utils import timezone

# Purpose: Register Timeline model in admin interface with custom configuration and actions
@admin.register(Timeline)
class TimelineAdmin(admin.ModelAdmin):
    # Purpose: Configure fields shown in admin list view
    list_display = ('section', 'teacher', 'start_time', 'duration', 'is_active', 'status')
    
    # Purpose: Add filtering options in admin sidebar
    list_filter = ('is_active', 'section', 'teacher')
    
    # Purpose: Define bulk actions available in admin interface
    actions = ['activate_timeline', 'deactivate_timeline']

    # Purpose: Get display status of timeline
    def status(self, obj):
        """
        Return the status of a timeline object as a string
        Args:
            obj: Timeline instance
        Returns:
            str: 'Active' if timeline is active, 'Inactive' otherwise
        """
        if obj.is_timeline_active():
            return "Active"
        return "Inactive"
    status.short_description = 'Status'
    
    # Purpose: Bulk action to activate multiple timelines at once
    def activate_timeline(self, request, queryset):
        """
        Bulk action to activate selected timelines
        Args:
            request: HTTP request object
            queryset: QuerySet of selected Timeline objects
        """
        current_time = timezone.now()
        for timeline in queryset:
            timeline.start_time = current_time
            timeline.is_active = True
            timeline.save()
    activate_timeline.short_description = "Activate selected timelines"

    # Purpose: Bulk action to deactivate multiple timelines at once
    def deactivate_timeline(self, request, queryset):
        """
        Bulk action to deactivate selected timelines
        Args:
            request: HTTP request object
            queryset: QuerySet of selected Timeline objects
        """
        queryset.update(is_active=False)
    deactivate_timeline.short_description = "Deactivate selected timelines"