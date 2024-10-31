from django import forms
from App.models import Student, Teacher, Section, Timeline
from django.contrib.auth import authenticate
from django.contrib.auth.forms import AuthenticationForm


class StudentForm(forms.ModelForm):
    # Meta class defines the model and form fields configuration
    class Meta:
        model = Student
        fields = ['name', 'student_input_id', 'email', 'section']
        widgets = {
            'section': forms.Select(attrs={'required': True}),  # Makes section field required with dropdown
        }
        labels = {
            'name': 'Full Name',
            'student_input_id': 'Student ID', 
            'email': 'Email'
        }

    # Validates that selected section belongs to selected teacher
    def clean(self):
        cleaned_data = super().clean()
        section = cleaned_data.get('section')

        if section and 'teacher' in self.data:
            teacher_id = self.data.get('teacher')
            if not Section.objects.filter(id=section.id, teacher_id=teacher_id).exists():
                raise forms.ValidationError({
                    'section': 'Selected section does not belong to the selected teacher.'
                })

        return cleaned_data

    # Validates that student ID is unique
    def clean_student_input_id(self):
        student_id = self.cleaned_data.get('student_input_id')
        if Student.objects.filter(student_input_id=student_id).exists():
            raise forms.ValidationError('This Student ID is already registered.')
        return student_id

    # Validates that email is unique
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if Student.objects.filter(email=email).exists():
            raise forms.ValidationError('This email is already registered.')
        return email

    # Initializes form and filters sections by teacher if teacher is selected
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'teacher' in self.data:
            try:
                teacher_id = int(self.data.get('teacher'))
                self.fields['section'].queryset = Section.objects.filter(teacher_id=teacher_id)
            except (ValueError, TypeError):
                pass

class TeacherLoginForm(forms.Form):
    # Define login form fields
    teacher_id = forms.CharField(required=True)
    email = forms.EmailField(required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)

    # Initialize form with request object for authentication
    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        self.user_cache = None
        super().__init__(*args, **kwargs)

    # Validates teacher credentials and authenticates user
    def clean(self):
        cleaned_data = super().clean()
        teacher_id = cleaned_data.get('teacher_id')
        email = cleaned_data.get('email')
        password = cleaned_data.get('password')

        if teacher_id and email and password:
            self.user_cache = authenticate(
                self.request,
                username=email,
                password=password,
                teacher_id=teacher_id
            )
            if self.user_cache is None:
                raise forms.ValidationError(
                    "Please enter a correct teacher ID, email and password."
                )
        return cleaned_data

    # Returns authenticated user object
    def get_user(self):
        return self.user_cache

class TimelineForm(forms.ModelForm):
    # Meta class defines the model and form fields
    class Meta:
        model = Timeline
        fields = ['hours', 'minutes', 'seconds']

    # Define time input fields with validation constraints
    hours = forms.IntegerField(min_value=0, required=True)
    minutes = forms.IntegerField(min_value=0, max_value=59, required=True)
    seconds = forms.IntegerField(min_value=0, max_value=59, required=True)

class TeacherForm(forms.ModelForm):
    # Meta class defines the model and form fields for teacher registration
    class Meta:
        model = Teacher
        fields = ['teacher_id', 'email', 'first_name', 'last_name']  # Use first_name and last_name
