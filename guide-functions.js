// ========== USER GUIDE SYSTEM ==========

window.toggleGuide = function (show = true) {
    const modal = document.getElementById('guide-modal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        if (show) {
            // Reset to first tab
            switchGuideTab('welcome');
        }
    }
};

window.switchGuideTab = function (tabId) {
    // Update nav items
    document.querySelectorAll('.guide-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(`'${tabId}'`)) {
            item.classList.add('active');
        }
    });

    // Update content sections
    document.querySelectorAll('.guide-section').forEach(section => {
        section.classList.remove('active');
    });

    const activeSection = document.getElementById(`guide-section-${tabId}`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
};

// Initialize Guide System
function initGuideSystem() {
    const btnHelp = document.getElementById('btn-help');
    const guideClose = document.querySelector('.guide-close');
    const guideModal = document.getElementById('guide-modal');

    if (btnHelp) {
        btnHelp.addEventListener('click', () => toggleGuide(true));
    }

    if (guideClose) {
        guideClose.addEventListener('click', () => toggleGuide(false));
    }

    if (guideModal) {
        guideModal.addEventListener('click', (e) => {
            if (e.target === guideModal) toggleGuide(false);
        });
    }
}
