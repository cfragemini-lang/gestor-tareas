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
    const dropdown = document.getElementById('tags-dropdown');
    const customInput = document.getElementById('input-tags-custom');
    const addButton = document.getElementById('btn-add-tag');

    if (!dropdown) return;

    // Handle dropdown change
    dropdown.addEventListener('change', (e) => {
        const value = e.target.value;

        if (value === 'otro') {
            // Show custom input
            if (customInput && addButton) {
                customInput.style.display = 'block';
                addButton.style.display = 'block';
                customInput.focus();
            }
        } else if (value) {
            // Add predefined tag
            addTag(value);
            dropdown.value = ''; // Reset dropdown
        }
    });

    // Handle custom tag input (Enter key)
    if (customInput) {
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = customInput.value.trim();
                if (value) {
                    addTag(value);
                    customInput.value = '';
                    customInput.style.display = 'none';
                    if (addButton) addButton.style.display = 'none';
                    dropdown.value = '';
                }
            }
        });
    }

    // Handle add button click
    if (addButton) {
        addButton.addEventListener('click', () => {
            const value = customInput.value.trim();
            if (value) {
                addTag(value);
                customInput.value = '';
                customInput.style.display = 'none';
                addButton.style.display = 'none';
                dropdown.value = '';
            }
        });
    }
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

// Populate tags filter dropdown
window.populateTagsFilter = function () {
    const filterTags = document.getElementById('filter-tags');
    if (!filterTags) return;

    const allTags = getAllTags();

    // Keep "Todos los tags" option and add tags
    filterTags.innerHTML = '<option value="">🏷️ Todos los tags</option>';

    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        filterTags.appendChild(option);
    });
};

// Initialize tags system
function initTagsSystem() {
    setupTagsInput();

    // Setup tags filter listener
    const filterTags = document.getElementById('filter-tags');
    if (filterTags) {
        filterTags.addEventListener('change', () => {
            if (window.applyFilters) {
                window.applyFilters();
            }
        });
    }
}
