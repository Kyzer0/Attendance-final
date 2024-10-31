// Get references to form elements for the main form
const sectionName = document.getElementById('section-name')
const studentCount = document.getElementById('student-count')
const createBtn = document.getElementById('create-btn')

// Get references to error message elements for the main form
const sectionNameError = document.getElementById('section-name-error')
const studentCountError = document.getElementById('student-count-error')
const submitError = document.getElementById('submit-error')

// Add event listeners for real-time validation
sectionName.addEventListener('keyup', validateSectionName)
studentCount.addEventListener('keyup', validateStudentCount)
createBtn.addEventListener('click', validateForm)

/**
 * Validates the section name input
 * Checks that it does not contain lowercase letters
 * Updates error message accordingly
 * Returns true if valid, false if invalid
 */
function validateSectionName() {
    const sectionNameValue = sectionName.value.trim()

    if (!/[a-z]/.test(sectionNameValue)) {
        sectionNameError.innerHTML = '<p>Section name must not contain lowercase letters</p>';
        return false;
    }

    sectionNameError.innerHTML = `<p class="valid">Section name valid</p>`
    return true
}

/**
 * Validates the student count input
 * Checks that it contains only numbers
 * Updates error message accordingly
 * Returns true if valid, false if invalid
 */
function validateStudentCount() {
    const studentCountValue = studentCount.value.trim()

    if (!studentCountValue.match(/^\d+$/)) {
        studentCountError.innerHTML = '<p>Student count must be a number</p>'
        return false
    }

    studentCountError.innerHTML = `<p class="valid">Student count valid</p>`
    return true
}

/**
 * Validates the entire form before submission
 * Checks that all fields are valid
 * Shows error message if validation fails
 * Submits form if validation passes
 */
function validateForm(e) {
    e.preventDefault()

    const isSectionNameValid = validateSectionName()
    const isStudentCountValid = validateStudentCount()

    if (!isSectionNameValid || !isStudentCountValid) {
        submitError.innerHTML = '<p>Fill all the blanks correctly</p>'
        submitError.style.display = 'block'

        setTimeout(() => {
            submitError.style.display = 'none'
        }, 2000)
        return false
    }

    // If validation passes, submit the form
    form.submit()
}

/**
 * Initializes the dashboard version of the create section form
 * Sets up validation and submission handling for the dashboard form
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get references to dashboard form elements
    const formDashboard = document.getElementById('create-section-form-dashboard');
    const sectionNameDashboard = document.getElementById('section-name-dashboard');
    const studentCountDashboard = document.getElementById('student-count-dashboard');
    const createBtnDashboard = document.getElementById('create-btn-dashboard');

    // Get references to dashboard error message elements
    const sectionNameErrorDashboard = document.getElementById('section-name-error-dashboard');
    const studentCountErrorDashboard = document.getElementById('student-count-error-dashboard');
    const submitErrorDashboard = document.getElementById('submit-error-dashboard');

    // Add event listeners for dashboard form validation
    sectionNameDashboard.addEventListener('keyup', validateSectionNameDashboard);
    studentCountDashboard.addEventListener('keyup', validateStudentCountDashboard);
    createBtnDashboard.addEventListener('click', validateFormDashboard);

    /**
     * Validates the section name input for dashboard form
     * Checks that it does not contain lowercase letters
     * Updates error message accordingly
     * Returns true if valid, false if invalid
     */
    function validateSectionNameDashboard() {
        const sectionNameValue = sectionNameDashboard.value.trim();

        if (!/[a-z]/.test(sectionNameValue)) {
            sectionNameErrorDashboard.innerHTML = '<p>Section name must not contain lowercase letters</p>';
            return false;
        }

        sectionNameErrorDashboard.innerHTML = `<p class="valid">Section name valid</p>`;
        return true;
    }

    /**
     * Validates the student count input for dashboard form
     * Checks that it contains only numbers
     * Updates error message accordingly
     * Returns true if valid, false if invalid
     */
    function validateStudentCountDashboard() {
        const studentCountValue = studentCountDashboard.value.trim();

        if (!studentCountValue.match(/^\d+$/)) {
            studentCountErrorDashboard.innerHTML = '<p>Student count must be a number</p>';
            return false;
        }

        studentCountErrorDashboard.innerHTML = `<p class="valid">Student count valid</p>`;
        return true;
    }

    /**
     * Validates the entire dashboard form before submission
     * Checks that all fields are valid
     * Shows error message if validation fails
     * Submits form if validation passes
     */
    function validateFormDashboard(e) {
        e.preventDefault();

        const isSectionNameValid = validateSectionNameDashboard();
        const isStudentCountValid = validateStudentCountDashboard();

        if (!isSectionNameValid || !isStudentCountValid) {
            submitErrorDashboard.innerHTML = '<p>Fill all the blanks correctly</p>';
            submitErrorDashboard.style.display = 'block';

            setTimeout(() => {
                submitErrorDashboard.style.display = 'none';
            }, 2000);
            return false;
        }

        // If validation passes, submit the form
        formDashboard.submit();
    }

    /**
     * Handles dashboard form submission via AJAX
     * Sends form data to server and handles response
     * Shows success/error messages
     * Redirects on success
     */
    formDashboard.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(formDashboard);
        fetch(formDashboard.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': '{{ csrf_token }}'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = '{% url "teacher_dashboard" %}';
            } else {
                alert(data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});