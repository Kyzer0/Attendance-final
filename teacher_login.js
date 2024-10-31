// This file handles teacher login form validation and submission

// Log when script loads to verify it's working
console.log('Teacher login script loaded');

// Get references to DOM elements needed for form validation and submission
const teacherId = document.getElementById('id_teacher_id');
const email = document.getElementById('email');
const password = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const lockPassword = document.getElementById('lock-password');
const teacherIdError = document.getElementById('teacher_id_error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const submitError = document.getElementById('submit-error');

// Add event listeners to validate form fields in real-time as user types
teacherId.addEventListener('keyup', validateTeacherId);
email.addEventListener('keyup', validateEmail);
password.addEventListener('keyup', () => validatePassword(password.value));

/**
 * Validates the teacher ID field
 * Checks if field is not empty
 * Updates error message accordingly
 * Returns true if valid, false if invalid
 */
function validateTeacherId() {
    const teacherIdValue = teacherId.value.trim();

    if (teacherIdValue.length == 0) {
        teacherIdError.innerHTML = '<p>Fill in your Teacher ID</p>';
        return false;
    }

    teacherIdError.innerHTML = '<p class="valid">Valid Teacher ID</p>';
    return true;
}

/**
 * Validates the email field
 * Checks if field is not empty and matches email format
 * Updates error message accordingly
 * Returns true if valid, false if invalid
 */
function validateEmail() {
    const emailValue = email.value.trim();

    if (emailValue.length == 0) {
        emailError.innerHTML = '<p>Fill in your email</p>';
        return false;
    }

    if (!emailValue.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)) {
        emailError.innerHTML = '<p>Enter a valid email</p>';
        return false;
    }

    emailError.innerHTML = '<p class="valid">Valid email</p>';
    return true;
}

/**
 * Validates the password field
 * Checks for:
 * - Minimum length of 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter 
 * - At least one number
 * - At least one special character
 * Updates error messages accordingly
 * Returns true if valid, false if invalid
 */
function validatePassword(passwordValue) {
    const minLength = 8;
    let isValid = true;
    let errorMessage = [];
    
    // Check password length
    if (passwordValue.length < minLength) {
        errorMessage.push("Password must be at least 8 characters long");
        isValid = false;
    }

    // Check for uppercase
    if (!/[A-Z]/.test(passwordValue)) {
        errorMessage.push("Password must contain at least one uppercase letter");
        isValid = false;
    }

    // Check for lowercase
    if (!/[a-z]/.test(passwordValue)) {
        errorMessage.push("Password must contain at least one lowercase letter");
        isValid = false;
    }

    // Check for numbers
    if (!/\d/.test(passwordValue)) {
        errorMessage.push("Password must contain at least one number");
        isValid = false;
    }

    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordValue)) {
        errorMessage.push("Password must contain at least one special character");
        isValid = false;
    }

    // Update error message
    if (!isValid) {
        passwordError.innerHTML = `<p>${errorMessage.join('<br>')}</p>`;
    } else {
        passwordError.innerHTML = "<p class='valid'>Valid password</p>";
    }

    return isValid;
}

/**
 * Toggles password visibility between hidden and shown
 * Updates lock icon accordingly
 */
lockPassword.addEventListener('click', () => {
    if (password.type == "password") {
        password.type = "text"
        lockPassword.classList.remove("bxs-lock")
        lockPassword.classList.add("bxs-lock-open")
    } else {
        password.type = "password"
        lockPassword.classList.remove("bxs-lock-open")
        lockPassword.classList.add("bxs-lock")
    }
});

/**
 * Handles form submission
 * Validates form data and sends to server
 * Handles success/failure responses
 * Updates UI with error messages if needed
 * Redirects on successful login
 */
document.getElementById('teacherLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous errors
    document.querySelectorAll('.error-tab').forEach(el => el.innerHTML = '');
    
    const formData = new FormData(this);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        },
        credentials: 'same-origin'
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            console.log('Redirecting to:', data.redirect_url);
            window.location.href = data.redirect_url;
        } else {
            console.log('Login failed:', data.errors);
            // Display errors
            if (data.errors) {
                Object.entries(data.errors).forEach(([field, message]) => {
                    const errorElement = document.getElementById(`${field}_error`);
                    if (errorElement) {
                        errorElement.innerHTML = `<p>${message}</p>`;
                    }
                });
            }
            document.getElementById('submit-error').innerHTML = 
                '<p>Login failed. Please check your credentials.</p>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('submit-error').innerHTML = 
            '<p>An error occurred. Please try again.</p>';
    });
});

// Add debug logging for password validation
password.addEventListener('keyup', () => {
    console.log('Password value:', password.value);
    console.log('Validation result:', validatePassword(password.value));
});
