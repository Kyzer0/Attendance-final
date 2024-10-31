from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# Custom manager class for Teacher model that handles user creation and superuser creation
class TeacherManager(BaseUserManager):
    # Creates and saves a new regular user with the given teacher_id, email and password
    def create_user(self, teacher_id, email, password, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not teacher_id:
            raise ValueError('Teacher ID is required')
        
        email = self.normalize_email(email)
        user = self.model(
            teacher_id=teacher_id,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Creates and saves a new superuser with the given teacher_id, email and password
    def create_superuser(self, teacher_id, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(teacher_id, email, password, **extra_fields)

# Custom user model for teachers that extends Django's built-in authentication
class Teacher(AbstractBaseUser, PermissionsMixin):
    teacher_id = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    objects = TeacherManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['teacher_id', 'first_name', 'last_name']

    # Returns string representation of teacher as "first_name last_name"
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    # Property that returns the full name of the teacher
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"