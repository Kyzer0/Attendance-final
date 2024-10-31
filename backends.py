from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

Teacher = get_user_model()

# Purpose: Custom authentication backend for Teacher model that validates using teacher_id and email
class TeacherAuthenticationBackend(ModelBackend):
    # Purpose: Authenticates a teacher using their teacher ID, email and password
    def authenticate(self, request, teacher_id=None, email=None, password=None, **kwargs):
        try:
            user = Teacher.objects.get(teacher_id=teacher_id, email=email)
            if user.check_password(password):
                return user
        except Teacher.DoesNotExist:
            return None

    # Purpose: Retrieves a teacher user instance by their primary key ID
    def get_user(self, user_id):
        try:
            return Teacher.objects.get(pk=user_id)
        except Teacher.DoesNotExist:
            return None
