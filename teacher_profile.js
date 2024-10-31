// Main initialization function that sets up event listeners for form submission and profile deletion
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('manage-profile-form');
    const deleteBtn = document.getElementById('delete-profile-btn');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Event listener for form submission to update teacher profile
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'update',
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value
        };

        // Send POST request to update profile information
        fetch('/teacher/profile/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                // Redirect to dashboard after successful update
                window.location.href = '/teacher/dashboard/';
            } else {
                alert(data.error || 'Update failed');
            }
        });
    });

    // Event listener for delete button to handle profile deletion
    deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete your profile? This cannot be undone.')) {
            // Send POST request to delete the profile
            fetch('/teacher/profile/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ action: 'delete' })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.href = '/teacher/login/';
                } else {
                    alert(data.error || 'Delete failed');
                }
            });
        }
    });
});

// Function to handle profile picture upload and preview
// Takes an event object containing the uploaded file information
function loadProfilePic(event) {
    const image = document.getElementById('profile-pic');
    image.src = URL.createObjectURL(event.target.files[0]);
    image.onload = () => URL.revokeObjectURL(image.src); // Free up memory after loading
}
