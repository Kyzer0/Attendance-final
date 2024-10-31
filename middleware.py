import traceback
from django.http import HttpResponse
import logging

logger = logging.getLogger(__name__)

class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            print(f"Error in request: {request.path}")
            print(f"Exception: {str(e)}")
            print(traceback.format_exc())
            return HttpResponse(f"Error: {str(e)}", status=500)

class DebugRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log request details
        if request.path.startswith('/api/'):
            logger.debug(f"API Request: {request.method} {request.path}")
            if request.method == 'POST':
                logger.debug(f"POST data: {request.POST}")

        response = self.get_response(request)

        # Log response details for API calls
        if request.path.startswith('/api/'):
            logger.debug(f"API Response status: {response.status_code}")

        return response
