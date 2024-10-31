// Main script initialization message
console.log("Teacher dashboard script loaded");

// Initialize sidebar functionality and state management when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    const sideBar = document.getElementById('side-bar');
    const backIcon = document.getElementById('back-icon');
    const arrow = document.getElementById('arrow');

    // Restore sidebar state from localStorage
    const sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState === 'hidden') {
        sideBar.classList.add('hide');
        arrow.classList.remove('bx-left-arrow-alt');
        arrow.classList.add('bx-right-arrow-alt');
    }

    // Toggle sidebar visibility and save state
    backIcon.addEventListener('click', () => {
        if (arrow.classList.contains('bx-left-arrow-alt')) {
            sideBar.classList.add('hide');
            arrow.classList.remove('bx-left-arrow-alt');
            arrow.classList.add('bx-right-arrow-alt');
            localStorage.setItem('sidebarState', 'hidden');
        } else {
            sideBar.classList.remove('hide');
            arrow.classList.remove('bx-right-arrow-alt');
            arrow.classList.add('bx-left-arrow-alt');
            localStorage.setItem('sidebarState', 'visible');
        }
    });

    // Get references to sidebar navigation elements
    const teacherProfile = document.getElementById('teacher-profile');
    const dashboard = document.getElementById('dashboard');
    const setTimeline = document.getElementById('set-timeline');
    const createSection = document.getElementById('create-section');
    const manageSection = document.getElementById('manage-section');

    // Get references to content board elements
    const boardTeacherProfile = document.getElementById('update-profile');
    const boardDashboard = document.getElementById('board-dashboard');
    const boardSetTimeline = document.getElementById('board-set-timeline');
    const boardCreateSection = document.getElementById('board-create-section');
    const boardManageSection = document.getElementById('board-set-manage-section');

    // Hide all content boards
    function hideAllBoards() {
        boardTeacherProfile.style.display = 'none';
        boardDashboard.style.display = 'none';
        boardCreateSection.style.display = 'none';
        boardSetTimeline.style.display = 'none';
        boardManageSection.style.display = 'none';
    }

    // Show specific content board
    function showBoard(board) {
        hideAllBoards();
        board.style.display = 'block';
    }

    // Handle sidebar navigation using event delegation
    document.querySelector('.links').addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (!target) return;

        e.preventDefault();

        switch(target.id) {
            case 'teacher-profile':
                showBoard(boardTeacherProfile);
                break;
            case 'dashboard':
                window.location.href = '/teacher/dashboard/'; // Refresh the page
                break;
            case 'set-timeline':
                showBoard(boardSetTimeline);
                break;
            case 'create-section':
                showBoard(boardCreateSection);
                break;
            case 'manage-section':
                showBoard(boardManageSection);
                break;
        }
    });

    // Show dashboard by default
    showBoard(boardDashboard);

    // Timer functionality setup
    const setTimelineForm = document.getElementById('set-timeline-form');
    const timerDisplay = document.getElementById('display');
    const timerStatus = document.getElementById('timer-status');
    const teacherId = document.querySelector('input[name="teacher"]').value;
    let currentInterval;

    // Check if there's an existing timer for the section
    function checkExistingTimer() {
        const sectionId = document.getElementById('section').value;
        fetch(`/get_remaining_time/?section_id=${sectionId}&teacher_id=${teacherId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.remaining_time > 0) {
                    startTimer(data.remaining_time, data.timeline_id);
                    timerStatus.textContent = 'Timeline active';
                    // Store timer state
                    localStorage.setItem('timerState', JSON.stringify({
                        timelineId: data.timeline_id,
                        endTime: new Date().getTime() + (data.remaining_time * 1000),
                        duration: data.duration
                    }));
                } else {
                    timerDisplay.textContent = "00:00:00";
                    timerStatus.textContent = "No active timeline";
                    localStorage.removeItem('timerState');
                }
            })
            .catch(error => console.error("Error fetching remaining time:", error));
    }

    // Start countdown timer with given duration
    function startTimer(duration, timelineId) {
        if (currentInterval) {
            clearInterval(currentInterval);
        }

        const endTime = new Date().getTime() + (duration * 1000);
        
        // Update timer display every second
        function updateDisplay() {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                clearInterval(currentInterval);
                timerDisplay.textContent = "00:00:00";
                timerStatus.textContent = "Timeline closed";
                localStorage.removeItem('timerState');
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            timerDisplay.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        currentInterval = setInterval(updateDisplay, 1000);
        updateDisplay();
    }

    // Initialize timer on page load
    checkExistingTimer();

    // Handle timeline form submission
    setTimelineForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': formData.get('csrfmiddlewaretoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                startTimer(data.duration * 60, data.timeline_id);
                timerStatus.textContent = 'Timeline active';
            } else {
                timerStatus.textContent = 'Failed to set timeline: ' + (data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error("Error:", error);
            timerStatus.textContent = 'Error setting timeline: ' + error.message;
        });
    });

    // Initialize teacher profile update functionality
    document.addEventListener('DOMContentLoaded', function() {
        const updateProfileForm = document.getElementById('update-profile-form');
        const submitProfileBtn = document.getElementById('submit-profile-btn');
        const updateTeacherBtn = document.getElementById('update-teacher-btn');
        const deleteTeacherBtn = document.getElementById('delete-teacher-btn');
    
        // Handle profile updates and deletion
        function updateProfile(action) {
            const formData = new FormData(updateProfileForm);
            formData.append('action', action);
            
            const csrftoken = getCookie('csrftoken');
        
            fetch('/api/update_teacher_profile/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    if (action === 'delete') {
                        window.location.href = '/teacher/login/';
                    } else {
                        document.getElementById('first-name').value = data.first_name;
                        document.getElementById('last-name').value = data.last_name;
                        document.getElementById('display-name').value = data.display_name;
                    }
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert('An error occurred. Please try again.');
            });
        }
    });

    // Initialize section creation functionality
    document.addEventListener('DOMContentLoaded', function() {
        const createSectionForm = document.getElementById('create-section-form');
        const createBtn = document.getElementById('create-btn');
    
        if (!createSectionForm || !createBtn) {
            console.error('Create Section form or button not found');
            return;
        }
    
        // Handle section creation form submission
        createSectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
    
            const formData = new FormData(this);
            console.log('Form data:', Object.fromEntries(formData.entries()));
    
            fetch(createSectionForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.href = '/teacher/dashboard/';
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        });
    });

    // Handle profile updates
    function updateProfile(action) {
        const fullName = document.getElementById('full-name').value;
        const displayName = document.getElementById('display-name').value;
        
        const data = {
            action: action,
            full_name: fullName,
            display_name: displayName
        };
    
        fetch('/api/update_teacher_profile/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                if (action === 'delete') {
                    window.location.href = '/teacher/login/';
                } else {
                    document.getElementById('full-name').value = data.full_name;
                    document.getElementById('display-name').value = data.display_name;
                }
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert('An error occurred. Please try again.');
        });
    }
    
    // Add event listeners for profile actions
    document.getElementById('submit-profile-btn').addEventListener('click', () => updateProfile('submit'));
    document.getElementById('update-teacher-btn').addEventListener('click', () => updateProfile('update'));
    document.getElementById('delete-teacher-btn').addEventListener('click', () => updateProfile('delete'));

    // Initialize section management functionality
    const manageSectionContainer = document.getElementById('board-set-manage-section');
    const sectionTableView = document.getElementById('section-table-view');
    const backToSectionsBtn = document.getElementById('back-to-sections');
    const sectionsListView = document.querySelector('.sections');

    // Handle section name clicks
    if (manageSectionContainer) {
        manageSectionContainer.addEventListener('click', function(e) {
            const sectionNameElement = e.target.closest('.section-name');
            if (sectionNameElement) {
                const sectionId = sectionNameElement.dataset.sectionId;
                const capacity = parseInt(sectionNameElement.dataset.capacity);
                const sectionName = sectionNameElement.textContent.trim();
                showSectionTable(sectionId, sectionName, capacity);
            }
        });
    }

    // Handle back button clicks
    if (backToSectionsBtn) {
        backToSectionsBtn.addEventListener('click', function() {
            sectionTableView.style.display = 'none';
            sectionsListView.style.display = 'block';
        });
    }

    // Add click handlers for sections
    const sections = document.querySelectorAll('.section-name');
    sections.forEach(section => {
        section.addEventListener('click', function() {
            const sectionId = this.dataset.sectionId;
            const sectionName = this.textContent.trim();
            window.location.href = `/section/${sectionId}/attendance/`;
        });
    });

    // Add update handlers for sections
    const updateButtons = document.querySelectorAll('.update-section');
    updateButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const sectionId = this.dataset.sectionId;
            const currentCapacity = this.dataset.capacity;
            updateSectionPrompt(sectionId, currentCapacity);
        });
    });

    // Add delete handlers for sections
    const deleteButtons = document.querySelectorAll('.delete-section');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const sectionId = this.dataset.sectionId;
            if (confirm('Are you sure you want to delete this section?')) {
                deleteSection(sectionId);
            }
        });
    });

    // Add CSS for clickable section names
    const style = document.createElement('style');
    style.textContent = `
        .section-name {
            cursor: pointer;
            padding: 10px;
            transition: background-color 0.3s;
        }
        .section-name:hover {
            background-color: #f0f0f0;
        }
    `;
    document.head.appendChild(style);
});

// Initialize teacher profile navigation
document.addEventListener('DOMContentLoaded', function() {
    const profileLink = document.getElementById('teacher-profile');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = "/teacher/profile/";
        });
    }
});

// Initialize section creation functionality
document.addEventListener('DOMContentLoaded', function() {
    const createSectionForm = document.getElementById('create-section-form');
    const createBtn = document.getElementById('create-btn');
    const sectionsContainer = document.getElementById('sections-container');

    if (!createSectionForm || !createBtn) {
        console.error('Create Section form or button not found');
        return;
    }

    // Handle create button clicks
    createBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Create Section button clicked');

        const formData = new FormData(createSectionForm);
        console.log('Form data:', Object.fromEntries(formData.entries()));

        const csrfToken = getCookie('csrftoken');
        console.log('CSRF Token:', csrfToken);

        // Handle form submission
        createSectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
        
            fetch('/create_section/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    addSectionToList(data.section_id, formData.get('section_name'));
                    createSectionForm.reset();
                    refreshTimelineSections();
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        });
    });
});

// Get CSRF token from cookies
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

// Add new section to the list
function addSectionToList(sectionId, sectionName) {
    const newSection = document.createElement('div');
    newSection.className = 'section';
    newSection.innerHTML = `
        <p class="section-name" data-section-id="${sectionId}">${sectionName}</p>
        <div class="options">
            <button class="delete-section" data-section-id="${sectionId}">Delete</button>
            <button class="update-section" data-section-id="${sectionId}">Update</button>
        </div>
    `;
    sectionsContainer.appendChild(newSection);
}

// Refresh sections in timeline dropdown
function refreshTimelineSections() {
    const timelineSectionSelect = document.getElementById('section');
    fetch('/get_teacher_sections/')
        .then(response => response.json())
        .then(sections => {
            timelineSectionSelect.innerHTML = '';
            sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section.id;
                option.textContent = section.section_name;
                timelineSectionSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error refreshing sections:', error));
}

// Initialize section table functionality
document.addEventListener('DOMContentLoaded', function() {
    // Section click handlers
    const sections = document.querySelectorAll('.section-name');
    sections.forEach(section => {
        section.addEventListener('click', function() {
            const sectionId = this.dataset.sectionId;
            const sectionName = this.textContent.trim();
            window.location.href = `/section/${sectionId}/attendance/`;
        });
    });

    // Update section handlers
    const updateButtons = document.querySelectorAll('.update-section');
    updateButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const sectionId = this.dataset.sectionId;
            const currentCapacity = this.dataset.capacity;
            updateSectionPrompt(sectionId, currentCapacity);
        });
    });

    // Delete section handlers
    const deleteButtons = document.querySelectorAll('.delete-section');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const sectionId = this.dataset.sectionId;
            if (confirm('Are you sure you want to delete this section?')) {
                deleteSection(sectionId);
            }
        });
    });

    // Add CSS for clickable section names
    const style = document.createElement('style');
    style.textContent = `
        .section-name {
            cursor: pointer;
            padding: 10px;
            transition: background-color 0.3s;
        }
        .section-name:hover {
            background-color: #f0f0f0;
        }
    `;
    document.head.appendChild(style);
});

// Handle section updates and deletions
const sectionsContainer = document.querySelector('.sections');
sectionsContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-section')) {
        e.stopPropagation();
        const sectionId = e.target.dataset.sectionId;
        if (confirm('Are you sure you want to delete this section?')) {
            deleteSection(sectionId);
        }
    }
    if (e.target.classList.contains('update-section')) {
        e.stopPropagation();
        const sectionId = e.target.dataset.sectionId;
        const currentCapacity = e.target.dataset.capacity;
        updateSectionPrompt(sectionId, currentCapacity);
    }
});

// Show update section prompt
function updateSectionPrompt(sectionId, currentCapacity) {
    const newName = prompt('Enter new section name:');
    const newCapacity = prompt('Enter new student capacity:', currentCapacity);
    
    if (newName && newCapacity) {
        updateSection(sectionId, newName, parseInt(newCapacity));
    }
}

// Update section details
function updateSection(sectionId, newName, newCapacity) {
    fetch(`/update_section/${sectionId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            section_name: newName,
            student_count: newCapacity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const sectionElement = document.querySelector(`.section-name[data-section-id="${sectionId}"]`);
            sectionElement.textContent = newName;
            sectionElement.dataset.capacity = newCapacity;
            sectionElement.closest('.section').querySelector('.update-section').dataset.capacity = newCapacity;
            alert('Section updated successfully');
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
}

// Delete section
function deleteSection(sectionId) {
    fetch(`/delete_section/${sectionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const sectionElement = document.querySelector(`.section[data-section-id="${sectionId}"]`);
            sectionElement.remove();
            alert('Section deleted successfully');
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
}

// Initialize navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.links a');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.id;
            switch(targetId) {
                case 'teacher-profile':
                    window.location.href = '/teacher/profile/';
                    break;
                case 'dashboard':
                    window.location.href = '/teacher/dashboard/';
                    break;
                case 'set-timeline':
                    showBoard(boardSetTimeline);
                    break;
                case 'create-section':
                    showBoard(boardCreateSection);
                    break;
                case 'manage-section':
                    showBoard(boardManageSection);
                    break;
                default:
                    break;
            }
        });
    });
});

// Update timer display with countdown
function updateTimerDisplay(startTime, duration) {
    const endTime = new Date(startTime).getTime() + duration * 60000;
    const timerDisplay = document.getElementById('display');

    function update() {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(interval);
            timerDisplay.textContent = "00:00:00";
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const interval = setInterval(update, 1000);
    update();
}
