from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

Teacher = get_user_model()

# Purpose: Custom authentication backend for Teacher model that handles authentication using email and teacher_id
class TeacherBackend(ModelBackend):
    # Purpose: Authenticates a teacher using their email (username), password and optional teacher_id
    def authenticate(self, request, username=None, password=None, teacher_id=None, **kwargs):
        try:
            # Try to find user by email (username) and teacher_id
            if username and teacher_id:
                user = Teacher.objects.get(email=username, teacher_id=teacher_id)
            elif username:  # Fallback to just email
                user = Teacher.objects.get(email=username)
            else:
                return None

            if user.check_password(password):
                return user
            return None
        except Teacher.DoesNotExist:
            return None

    # Purpose: Retrieves a teacher user instance by their primary key ID
    def get_user(self, user_id):
        try:
            return Teacher.objects.get(pk=user_id)
        except Teacher.DoesNotExist:
            return None
