from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.db.models import Q
from .models import StudentSubmission, Section, Timeline, Student, Attendance, Teacher
from openpyxl import Workbook
from datetime import timedelta

import time
import traceback
import json
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Section
from .forms import StudentForm, TeacherLoginForm, TimelineForm, TeacherForm
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy, reverse
from django.contrib.auth import login as auth_login
from django.views.generic import FormView
import logging
from django.utils import timezone
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

# Purpose: Class that handles teacher login with form validation and AJAX support
class TeacherLoginView(FormView):
    template_name = 'teacher_login.html'
    form_class = TeacherLoginForm
    
    def get_success_url(self):
        user = self.request.user
        if Section.objects.filter(teacher=user).exists():
            return reverse_lazy('teacher_dashboard')
        return reverse_lazy('create_section')

    def form_valid(self, form):
        user = form.get_user()
        auth_login(self.request, user)
        
        # For AJAX requests
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'redirect_url': self.get_success_url()
            })
        return super().form_valid(form)

    def form_invalid(self, form):
        # For AJAX requests
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            errors = {field: str(error[0]) for field, error in form.errors.items()}
            return JsonResponse({
                'success': False,
                'errors': errors
            }, status=400)
        return super().form_invalid(form)

# Purpose: Function that handles student submission form on home page
def student_submission(request):
    if request.method == 'POST':
        print("Received POST request for student submission")
        try:
            # Get form data
            student_id = request.POST.get('student_input_id')
            name = request.POST.get('name')
            email = request.POST.get('email')
            section_id = request.POST.get('section')
            teacher_id = request.POST.get('teacher')
            
            print(f"Processing submission: student_id={student_id}, name={name}, email={email}")
            
            # Validate required fields
            if not all([student_id, name, email, section_id, teacher_id]):
                return JsonResponse({
                    'success': False,
                    'error': 'All fields are required'
                })

            # Check for existing student
            if Student.objects.filter(student_input_id=student_id).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'This Student ID is already registered.'
                })

            # Create student
            student = Student.objects.create(
                name=name,
                student_input_id=student_id,
                email=email,
                section_id=section_id,
                teacher_id=teacher_id
            )

            # Create submission
            StudentSubmission.objects.create(
                student=student,
                section_id=section_id,
                teacher_id=teacher_id
            )

            print(f"Successfully created submission for student {student_id}")
            return JsonResponse({'success': True})

        except Exception as e:
            print(f"Error in student submission: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            })

    # GET request handling...
    teachers = Teacher.objects.all()
    return render(request, 'student_submission.html', {'teachers': teachers})
    
# Purpose: Function that creates and manages timelines for sections
@login_required
@require_POST
def set_timeline(request):
    try:
        section_id = request.POST.get('section')
        duration = int(request.POST.get('duration'))
        section = get_object_or_404(Section, id=section_id)
        current_teacher = request.user

        # Deactivate existing timelines
        Timeline.objects.filter(
            section=section,
            teacher=current_teacher,
            is_active=True
        ).update(is_active=False)

        # Create new timeline
        timeline = Timeline.objects.create(
            section=section,
            teacher=current_teacher,
            start_time=timezone.now(),
            duration=duration,
            is_active=True
        )

        print(f"Timeline created: {timeline.id} for section {section_id}")
        
        return JsonResponse({
            'success': True,
            'duration': duration,
            'timeline_id': timeline.id,
            'teacher_id': current_teacher.id,
            'section_id': section_id
        })
    except Exception as e:
        print(f"Error in set_timeline: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
    
# Purpose: Function that renders success page after submission
def submission_success(request):
    return render(request, 'submission_success.html')

# Purpose: Function that gets sections for a specific teacher
def get_teacher_sections(request, teacher_id):
    try:
        teacher = Teacher.objects.get(id=teacher_id)
        sections = Section.objects.filter(teacher=teacher)
        
        # Use a dictionary to ensure unique sections
        sections_data = {
            section.id: {
                'id': section.id,
                'name': section.section_name
            } for section in sections
        }
        
        print(f"Sections found for teacher {teacher_id}: {list(sections_data.values())}")
        return JsonResponse(list(sections_data.values()), safe=False)
    except Teacher.DoesNotExist:
        return JsonResponse({'error': 'Teacher not found'}, status=404)
    except Exception as e:
        print(f"Error in get_teacher_sections: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

# Purpose: Function that searches for teachers based on name or username
def search_teachers(request):
    term = request.GET.get('term', '')
    teachers = Teacher.objects.filter(
        Q(display_name__icontains=term) | Q(username__icontains=term)
    )[:5]  # Limit to 5 results
    data = [{'id': t.id, 'display_name': t.display_name or t.username} for t in teachers]
    return JsonResponse(data, safe=False)

# Purpose: Function that gets sections for authenticated teacher
def teacher_sections(request, teacher_id):
    # Ensure the teacher_id matches the logged-in user
    if request.user.id != teacher_id:
        return JsonResponse({'error': 'Unauthorized access'}, status=403)

    sections = Section.objects.filter(teacher_id=teacher_id)
    data = [{'id': s.id, 'section_name': s.section_name} for s in sections]
    return JsonResponse(data, safe=False)

# Purpose: Function that handles teacher login authentication
@login_required
def teacher_login(request):
    if request.method == 'POST':
        form = TeacherLoginForm(request.POST)
        if form.is_valid():
            teacher_id = form.cleaned_data.get('teacher_id')
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            
            user = authenticate(request, teacher_id=teacher_id, email=email, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, "Login successful.")
                return redirect('teacher_dashboard')  # Replace with your dashboard URL name
            else:
                messages.error(request, 'Invalid Teacher ID, Email or Password.')
        else:
            messages.error(request, "Invalid form data.")
    else:
        form = TeacherLoginForm()
    
    return render(request, 'teacher_login.html', {'form': form})

# Purpose: Function that displays teacher dashboard with sections and students
@login_required(login_url='teacher_login')
def teacher_dashboard(request):
    teacher = request.user
    sections = Section.objects.filter(teacher=teacher)
    students = Student.objects.filter(section__in=sections)

    # Generate blank rows for each section
    blank_rows = []
    for section in sections:
        existing_students = students.filter(section=section).count()
        blank_count = max(0, section.student_capacity - existing_students)
        blank_rows.extend([{'section': section.section_name} for _ in range(blank_count)])

    context = {
        'teacher': teacher,
        'sections': sections,
        'students': students,
        'blank_rows': blank_rows,
    }

    return render(request, 'teacher_dashboard.html', context)

# Purpose: Function that creates new section for teacher
@login_required(login_url='teacher_login')
@require_http_methods(["GET", "POST"])
def create_section(request):
    if request.method == 'POST':
        section_name = request.POST.get('section_name')
        student_count = request.POST.get('student_count')
        if section_name and student_count:
            section = Section.objects.create(
                section_name=section_name,
                teacher=request.user,
                student_capacity=int(student_count)
            )
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Section created successfully',
                    'section_id': section.id
                })
            else:
                return redirect('teacher_dashboard')  # Redirect to teacher dashboard
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'Section name and student count are required'
                })
    return render(request, 'create_section.html')

# Purpose: Function that gets sections for authenticated teacher
@login_required
def get_teacher_sections(request):
    sections = Section.objects.filter(teacher=request.user)
    sections_data = [{'id': section.id, 'section_name': section.section_name} for section in sections]
    return JsonResponse(sections_data, safe=False)

# Purpose: Function that gets students for a specific section
@login_required
def get_section_students(request, section_id):
    try:
        section = get_object_or_404(Section, id=section_id, teacher=request.user)
        students = Student.objects.filter(section=section)
        
        students_data = [{
            'name': student.name,
            'student_id': student.student_input_id,
            'email': student.email
        } for student in students]
        
        return JsonResponse({
            'success': True,
            'students': students_data,
            'capacity': section.student_capacity
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

# Purpose: Function that gets remaining time for active timeline
def get_remaining_time(request):
    section_id = request.GET.get('section_id')
    teacher_id = request.GET.get('teacher_id')
    try:
        timeline = Timeline.objects.filter(
            section_id=section_id,
            teacher_id=teacher_id,
            is_active=True
        ).latest('start_time')
        
        remaining_time = timeline.get_remaining_time()
        return JsonResponse({
            'success': True,
            'remaining_time': remaining_time,
            'timeline_id': timeline.id,
            'duration': timeline.duration
        })
    except Timeline.DoesNotExist:
        return JsonResponse({
            'success': False,
            'remaining_time': 0
        })

# Purpose: Function that updates or deletes teacher profile    
@login_required
@csrf_exempt
def update_teacher_profile(request):
    if request.method == 'POST':
        teacher = request.user
        data = json.loads(request.body)
        action = data.get('action')

        if action == 'update':
            teacher.first_name = data.get('first_name', teacher.first_name)
            teacher.last_name = data.get('last_name', teacher.last_name)
            teacher.save()
            return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
        elif action == 'delete':
            teacher.delete()
            return JsonResponse({'success': True, 'message': 'Profile deleted successfully'})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid action'})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

# Purpose: Function that gets list of active teachers
def get_teachers(request):
    teachers = Teacher.objects.filter(is_active=True).values('id', 'teacher_id', 'email', 'full_name', 'display_name')
    return JsonResponse(list(teachers), safe=False)

# Purpose: Function that gets sections for specific teacher
def get_teacher_sections(request, teacher_id):
    try:
        teacher = Teacher.objects.get(id=teacher_id)
        sections = Section.objects.filter(teacher=teacher)
        
        sections_data = [{
            'id': section.id,
            'name': section.section_name
        } for section in sections]
        
        print(f"Sections found for teacher {teacher_id}: {sections_data}")  # Debug print
        return JsonResponse(sections_data, safe=False)
    except Teacher.DoesNotExist:
        return JsonResponse({'error': 'Teacher not found'}, status=404)
    except Exception as e:
        print(f"Error in get_teacher_sections: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

# Purpose: Function that manages teacher accounts
@login_required
def manage_teachers(request):
    teachers = Teacher.objects.all()
    if request.method == 'POST':
        form = TeacherForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('manage_teachers')
    else:
        form = TeacherForm()
    return render(request, 'manage_teachers.html', {'teachers': teachers, 'form': form})

# Purpose: Function that displays section attendance
@login_required
def section_attendance(request, section_id):
    section = get_object_or_404(Section, id=section_id)
    students = Student.objects.filter(section=section)
    student_count = students.count()
    capacity = section.student_capacity

    if request.method == 'POST':
        if student_count < capacity:
            # Handle form submission logic here
            pass
        else:
            # Return an error message or redirect
            return redirect('section_attendance', section_id=section_id)

    blank_rows = capacity - student_count

    context = {
        'section': section,
        'students': students,
        'blank_rows': blank_rows,
    }
    return render(request, 'attendanceTable.html', context)

# Purpose: Function that edits teacher information
@login_required
def edit_teacher(request, teacher_id):
    teacher = get_object_or_404(Teacher, id=teacher_id)
    if request.method == 'POST':
        form = TeacherForm(request.POST, instance=teacher)
        if form.is_valid():
            form.save()
            return redirect('manage_teachers')
    else:
        form = TeacherForm(instance=teacher)
    return render(request, 'edit_teacher.html', {'form': form, 'teacher': teacher})

# Purpose: Function that deletes teacher
@login_required
def delete_teacher(request, teacher_id):
    teacher = get_object_or_404(Teacher, id=teacher_id)
    if request.method == 'POST':
        teacher.delete()
        messages.success(request, f"Teacher {teacher.email} has been deleted.")
        return redirect('manage_teachers')
    return render(request, 'confirm_delete_teacher.html', {'teacher': teacher})

# Purpose: Function that exports attendance to Excel
@login_required(login_url='teacher_login')
def export_attendance_to_excel(request, section_id):
    # Get the section and its students
    section = get_object_or_404(Section, id=section_id, teacher=request.user)
    students = Student.objects.filter(section=section)

    # Create an Excel workbook and worksheet
    wb = Workbook()
    ws = wb.active
    ws.title = "Attendance"

    # Add section details
    ws.append(["Section Name:", section.section_name])
    ws.append(["Capacity:", section.student_capacity])
    ws.append([])  # Empty row for spacing

    # Add table headers
    ws.append(["Fullname", "Student ID", "Email", "Submitted Time"])

    # Add student data
    for student in students:
        ws.append([
            student.name,
            student.student_input_id,
            student.email,
            student.created_at.strftime("%I:%M %p")  # Format time as "h:i A"
        ])

    # Prepare the HTTP response
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename={section.section_name}_attendance.xlsx'

    # Save the workbook to the response
    wb.save(response)
    return response

# Purpose: Function that deletes section
@login_required
def delete_section(request, section_id):
    try:
        section = get_object_or_404(Section, id=section_id, teacher=request.user)
        section.delete()
        return JsonResponse({'success': True})
    except Section.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Section does not exist'}, status=404)

# Purpose: Function that updates section
@login_required
@require_POST
def update_section(request, section_id):
    try:
           section = get_object_or_404(Section, id=section_id, teacher=request.user)
           data = json.loads(request.body)
           section.section_name = data['section_name']
           section.student_capacity = data['student_count']
           section.save()
           return JsonResponse({'success': True})
    except Exception as e:
           return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
# Purpose: Function that manages teacher profile
@login_required
def teacher_profile(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            
            if action == 'update':
                request.user.first_name = data.get('first_name')
                request.user.last_name = data.get('last_name')
                # Add any additional profile fields here
                request.user.department = data.get('department', '')
                request.user.contact_number = data.get('contact_number', '')
                request.user.save()
                
                return JsonResponse({
                    'success': True,
                    'message': 'Profile updated successfully',
                    'redirect_url': '/teacher/dashboard/'  # Add redirect URL
                })
                
            elif action == 'delete':
                # Store sections to reassign or delete
                sections = request.user.sections.all()
                # Handle sections before deleting user
                for section in sections:
                    section.delete()  # Or reassign to another teacher
                
                request.user.delete()
                return JsonResponse({
                    'success': True,
                    'message': 'Profile deleted successfully',
                    'redirect_url': '/teacher/login/'
                })
                
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
            
    return render(request, 'teacher_profile.html', {
        'teacher': request.user,
        'sections': request.user.sections.all()  # Include sections in context
    })

# Purpose: Function that gets sections for specific teacher
def get_teacher_sections(request, teacher_id):
    try:
        # Verify teacher exists
        teacher = Teacher.objects.get(id=teacher_id)
        
        # Get sections for this teacher
        sections = Section.objects.filter(teacher=teacher)
        
        # Format section data
        sections_data = [{
            'id': section.id,
            'name': section.section_name
        } for section in sections]
        
        print(f"Sections found for teacher {teacher_id}: {sections_data}")  # Debug print
        return JsonResponse(sections_data, safe=False)
        
    except Teacher.DoesNotExist:
        return JsonResponse({
            'error': 'Teacher not found'
        }, status=404)
        
    except Exception as e:
        print(f"Error fetching sections: {str(e)}")  # Debug print
        return JsonResponse({
            'error': 'Error fetching sections'
        }, status=500)

# Purpose: Function that checks if student ID exists
def check_student_id(request):
    student_id = request.GET.get('id')
    is_available = not Student.objects.filter(student_input_id=student_id).exists()
    return JsonResponse({'available': is_available})

# Purpose: Function that checks if email exists
def check_email(request):
    email = request.GET.get('email')
    is_available = not Student.objects.filter(email=email).exists()
    return JsonResponse({'available': is_available})

# Purpose: Function that checks timeline status
def check_timeline_status(request):
    section_id = request.GET.get('section_id')
    teacher_id = request.GET.get('teacher_id')
    
    print(f"Checking timeline for section {section_id} and teacher {teacher_id}")
    
    try:
        timeline = Timeline.objects.filter(
            section_id=section_id,
            teacher_id=teacher_id,
            is_active=True
        ).latest('start_time')
        
        is_active = timeline.is_timeline_active()
        remaining_time = timeline.get_remaining_time()
        
        print(f"Timeline found: active={is_active}, remaining={remaining_time}")
        print(f"Timeline details: start={timeline.start_time}, duration={timeline.duration}")
        
        return JsonResponse({
            'success': True,
            'is_active': is_active,
            'remaining_time': remaining_time
        })
            
    except Timeline.DoesNotExist:
        print("No active timeline found")
        return JsonResponse({
            'success': False,
            'error': 'Teacher Attendance is Closed!'
        })

# Purpose: Function that tests timeline functionality
@login_required
def test_timeline(request):
    """Endpoint for testing timeline functionality"""
    if request.method == 'GET':
        section_id = request.GET.get('section_id')
        try:
            timeline = Timeline.objects.filter(
                section_id=section_id,
                is_active=True
            ).latest('start_time')
            
            return JsonResponse({
                'success': True,
                'timeline_id': timeline.id,
                'start_time': timeline.start_time.isoformat(),
                'duration': timeline.duration,
                'is_active': timeline.is_active,
                'remaining_time': timeline.get_remaining_time(),
                'teacher_id': timeline.teacher_id
            })
        except Timeline.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'No active timeline found'
            })

# Purpose: Function that provides view for manual timeline testing
@login_required
def test_timeline_view(request, section_id):
    """View for manual timeline testing"""
    section = get_object_or_404(Section, id=section_id)
    timelines = Timeline.objects.filter(section=section).order_by('-start_time')
    
    context = {
        'section': section,
        'timelines': timelines,
        'current_time': timezone.now(),
    }
    return render(request, 'test_timeline.html', context)

# Purpose: Function that provides view for manual timeline testing
@login_required
def test_timeline_view(request, section_id):
    """View for manual timeline testing"""
    section = get_object_or_404(Section, id=section_id)
    timelines = Timeline.objects.filter(section=section).order_by('-start_time')
    
    context = {
        'section': section,
        'timelines': timelines,
        'current_time': timezone.now(),
    }
    return render(request, 'test_timeline.html', context)
