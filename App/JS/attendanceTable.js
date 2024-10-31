// Section name click handler
if (sectionsContainer) {
    sectionsContainer.addEventListener('click', function(e) {
        const sectionNameElement = e.target.closest('.section-name');
        if (sectionNameElement) {
            const sectionId = sectionNameElement.dataset.sectionId;
            // Redirect to the attendance page
            window.location.href = `/section/${sectionId}/attendance/`;
        }
    });
}

