document.addEventListener('DOMContentLoaded', function() {
    // Get all form elements and store them in variables for easy access
    const form = document.getElementById('student-form');
    const teacherSelect = document.getElementById('teacher-select');
    const sectionSelect = document.getElementById('section-select');
    const nameInput = document.getElementById('name');
    const studentIdInput = document.getElementById('student-id');
    const emailInput = document.getElementById('email');
    const nameError = document.getElementById('name-error');
    const studentIdError = document.getElementById('studentid-error');
    const teacherError = document.querySelector('.error-tab');
    const sectionError = document.getElementById('section-error');
    const emailError = document.getElementById('email-error');
    const submitError = document.getElementById('submit-error');
    const modal = document.getElementById('error-modal');
    const modalMessage = document.getElementById('modal-message');
    const closeButton = document.querySelector('.close-button');
    const modalOkBtn = document.getElementById('modal-ok-btn');

    // Initially disable section select until teacher is selected
    sectionSelect.disabled = true;

    // Flag to prevent duplicate fetches when selecting teacher
    let isFetching = false;  
    
    // Handler for when teacher is selected - fetches corresponding sections
    teacherSelect.addEventListener('change', function() {
        const teacherId = this.value;
        console.log('Teacher selected:', teacherId);
        
        // Clear existing options and set default
        sectionSelect.innerHTML = '<option value="">Select a section</option>';
        sectionSelect.disabled = !teacherId;
    
        if (teacherId && !isFetching) {
            isFetching = true;
            console.log('Fetching sections for teacher:', teacherId);
            
            fetch(`/api/teacher-sections/${teacherId}/`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(sections => {
                    console.log('Sections received:', sections);
                    if (Array.isArray(sections)) {
                        // Use Set to track unique sections to avoid duplicates
                        const addedSections = new Set();
                        sections.forEach(section => {
                            if (!addedSections.has(section.id)) {
                                const option = document.createElement('option');
                                option.value = section.id;
                                option.textContent = section.name;
                                sectionSelect.appendChild(option);
                                addedSections.add(section.id);
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching sections:', error);
                    sectionError.textContent = 'Error loading sections';
                })
                .finally(() => {
                    isFetching = false;
                });
        }
    });

    // Regular expression patterns for input validation
    const patterns = {
        fullName: /^[A-Za-z\s'-]{2,50}$/,
        studentId: /^[A-Z0-9]{12}$/,
        email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    };

    // Error messages for different validation scenarios
    const messages = {
        fullName: {
            required: 'Please enter your full name',
            invalid: 'Name should only contain letters, spaces, hyphens, and apostrophes',
            length: 'Name should be between 2 and 50 characters'
        },
        studentId: {
            required: 'Please enter your student ID',
            invalid: 'Student ID should be 6-10 characters of letters and numbers only',
            duplicate: 'This Student ID is already registered'
        },
        email: {
            required: 'Please enter your email address',
            invalid: 'Please enter a valid email address',
            duplicate: 'This email address is already registered'
        }
    };

    // Function to validate all form inputs before submission
    function validateForm() {
        let isValid = true;
        clearErrors();

        // Full Name Validation
        const name = nameInput.value.trim();
        if (!name) {
            nameError.textContent = messages.fullName.required;
            isValid = false;
        } else if (name.length < 2 || name.length > 50) {
            nameError.textContent = messages.fullName.length;
            isValid = false;
        } else if (!patterns.fullName.test(name)) {
            nameError.textContent = messages.fullName.invalid;
            isValid = false;
        }

        // Student ID Validation
        const studentId = studentIdInput.value.trim();
        if (!studentId) {
            studentIdError.textContent = messages.studentId.required;
            isValid = false;
        } else if (!patterns.studentId.test(studentId)) {
            studentIdError.textContent = messages.studentId.invalid;
            isValid = false;
        }

        // Email Validation
        const email = emailInput.value.trim();
        if (!email) {
            emailError.textContent = messages.email.required;
            isValid = false;
        } else if (!patterns.email.test(email)) {
            emailError.textContent = messages.email.invalid;
            isValid = false;
        }

        // Teacher Selection Validation
        if (!teacherSelect.value) {
            teacherError.textContent = 'Please select a teacher';
            isValid = false;
        }

        // Section Selection Validation
        if (!sectionSelect.value) {
            sectionError.textContent = 'Please select a section';
            isValid = false;
        }

        return isValid;
    }

    // Function to close the error modal
    function closeModal() {
        modal.style.display = 'none';
    }

    // Event handlers for closing modal
    closeButton.onclick = closeModal;
    modalOkBtn.onclick = closeModal;
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    // Function to check if teacher's timeline is active before submission
    async function checkTimelineStatus(teacherId, sectionId) {
        try {
            console.log('Checking timeline status for:', teacherId, sectionId);
            const response = await fetch(`/check_timeline_status/?teacher_id=${teacherId}&section_id=${sectionId}`);
            const data = await response.json();
            console.log('Timeline status response:', data);
            
            if (data.success && data.is_active) {
                return true;
            } else {
                showModal(data.error || 'Teacher Attendance is Closed!');
                return false;
            }
        } catch (error) {
            console.error('Error checking timeline:', error);
            showModal('Error checking attendance status');
            return false;
        }
    }

    // Handler for form submission with validation and timeline check
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submission started');

        if (validateForm()) {
            const teacherId = teacherSelect.value;
            const sectionId = sectionSelect.value;

            const isTimelineActive = await checkTimelineStatus(teacherId, sectionId);
            
            if (isTimelineActive) {
                const formData = new FormData(this);
                
                try {
                    const response = await fetch('/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken')
                        }
                    });
                    
                    const data = await response.json();
                    console.log('Submission response:', data);

                    if (data.success) {
                        // Redirect to success page
                        window.location.href = '/submission_success/';
                    } else {
                        showModal(data.error || 'Submission failed');
                    }
                } catch (error) {
                    console.error('Submission error:', error);
                    showModal('An error occurred during submission');
                }
            }
        }
    });

    // Function to clear all error messages
    function clearErrors() {
        nameError.textContent = '';
        studentIdError.textContent = '';
        emailError.textContent = '';
        teacherError.textContent = '';
        sectionError.textContent = '';
    }

    // Function to display error modal with message
    function showModal(message) {
        modalMessage.textContent = message;
        modal.style.display = 'block';
        console.log('Showing modal:', message);
    }

    // Apply error styling to error message elements
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.color = '#ff0000';
        element.style.fontSize = '0.8em';
        element.style.marginTop = '10px';
    });

    // Check for duplicate student ID when input loses focus
    studentIdInput.addEventListener('blur', function() {
        if (this.value.trim()) {
            fetch(`/check_student_id/?id=${this.value.trim()}`)
                .then(response => response.json())
                .then(data => {
                    if (!data.available) {
                        studentIdError.textContent = 'This Student ID is already registered.';
                    } else {
                        studentIdError.textContent = '';
                    }
                });
        }
    });

    // Check for duplicate email when input loses focus
    emailInput.addEventListener('blur', function() {
        if (this.value.trim()) {
            fetch(`/check_email/?email=${this.value.trim()}`)
                .then(response => response.json())
                .then(data => {
                    if (!data.available) {
                        emailError.textContent = 'This email address is already registered.';
                    } else {
                        emailError.textContent = '';
                    }
                });
        }
    });

    // Real-time validation for Full Name input
    nameInput.addEventListener('input', function() {
        const name = this.value.trim();
        if (name) {
            if (name.length < 2 || name.length > 50) {
                nameError.textContent = messages.fullName.length;
            } else if (!patterns.fullName.test(name)) {
                nameError.textContent = messages.fullName.invalid;
            } else {
                nameError.textContent = '';
            }
        } else {
            nameError.textContent = '';
        }
    });

    // Real-time validation for Student ID with duplicate check
    studentIdInput.addEventListener('input', function() {
        const studentId = this.value.trim();
        if (studentId) {
            if (!patterns.studentId.test(studentId)) {
                studentIdError.textContent = messages.studentId.invalid;
            } else {
                // Check for duplicate ID
                fetch(`/check_student_id/?id=${studentId}`)
                    .then(response => response.json())
                    .then(data => {
                        studentIdError.textContent = data.available ? '' : messages.studentId.duplicate;
                    });
            }
        } else {
            studentIdError.textContent = '';
        }
    });

    // Real-time validation for Email with debounce and duplicate check
    let emailTimeout;
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        clearTimeout(emailTimeout);

        if (email) {
            if (!patterns.email.test(email)) {
                emailError.textContent = messages.email.invalid;
            } else {
                emailError.textContent = 'Checking email...';
                emailTimeout = setTimeout(() => {
                    fetch(`/check_email/?email=${email}`)
                        .then(response => response.json())
                        .then(data => {
                            emailError.textContent = data.available ? '' : messages.email.duplicate;
                        });
                }, 500); // Debounce delay
            }
        } else {
            emailError.textContent = '';
        }
    });

    // Function to add visual feedback for validation states
    function styleValidationFeedback() {
        const inputs = [nameInput, studentIdInput, emailInput];
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.classList.remove('invalid');
            });
            
            input.addEventListener('blur', function() {
                if (this.nextElementSibling.textContent) {
                    this.classList.add('invalid');
                }
            });
        });
    }

    // Initialize validation styling
    styleValidationFeedback();

    // Add CSS styles for validation feedback
    const style = document.createElement('style');
    style.textContent = `
        .input-tab input.invalid {
            border-color: #ff0000;
            background-color: #fff0f0;
        }
        .error-tab {
            color: #ff0000;
            font-size: 0.8em;
            margin-top: 5px;
            min-height: 1.2em;
        }
        .input-tab input:focus {
            border-color: #4CAF50;
            outline: none;
        }
    `;
    document.head.appendChild(style);

    // Function to get CSRF token from cookies for form submission
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});