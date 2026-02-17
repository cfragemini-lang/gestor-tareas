// ========== TAGS SYSTEM ==========

let currentTags = [];

// Generate color index from tag name
function getTagColorIndex(tagName) {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
        hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 8) + 1;
}

// Add tag
window.addTag = function (tagName) {
    // Normalize tag
    tagName = tagName.toLowerCase().trim().replace(/\s+/g, '-');

    if (!tagName) return;

    // Check max tags
    if (currentTags.length >= 5) {
        alert('Máximo 5 tags por tarea');
        return;
    }

    // Check duplicates
    if (currentTags.includes(tagName)) {
        return;
    }

    currentTags.push(tagName);
    renderTagsChips();
    document.getElementById('input-tags').value = '';
};

// Remove tag
window.removeTag = function (tagName) {
    currentTags = currentTags.filter(t => t !== tagName);
    renderTagsChips();
};

// Render tags chips in modal
function renderTagsChips() {
    const container = document.getElementById('tags-chips');
    if (!container) return;

    container.innerHTML = currentTags.map(tag => {
        const colorIndex = getTagColorIndex(tag);
        return `
            <div class="tag-chip" data-tag-color="${colorIndex}">
                <span>${tag}</span>
                <button type="button" class="tag-chip-remove" onclick="removeTag('${tag}')">
                    ×
                </button>
            </div>
        `;
    }).join('');
}

// Setup tags input listener
function setupTagsInput() {
    const tagsInput = document.getElementById('input-tags');
    if (!tagsInput) return;

    tagsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tagName = tagsInput.value.trim();
            if (tagName) {
                addTag(tagName);
            }
        }
    });
}

// Render tags in task card
function renderTaskTags(tags) {
    if (!tags || tags.length === 0) return '';

    return `
        <div class="task-tags">
            ${tags.map(tag => {
        const colorIndex = getTagColorIndex(tag);
        return `<span class="task-tag-badge" data-tag-color="${colorIndex}">${tag}</span>`;
    }).join('')}
        </div>
    `;
}

// Get all unique tags from tasks
function getAllTags() {
    const allTags = new Set();
    tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => allTags.add(tag));
        }
    });
    return Array.from(allTags).sort();
}

// Initialize tags system
function initTagsSystem() {
    setupTagsInput();
}
