// ========== RECURRING TASKS SYSTEM ==========

let currentRecurringConfig = {
    isRecurring: false,
    type: 'daily',
    dailyInterval: 1,
    weeklyDays: [],
    monthlyDay: 1
};

// Toggle recurring configuration panel
window.toggleRecurringConfig = function () {
    const checkbox = document.getElementById('input-recurring');
    const config = document.getElementById('recurring-config');

    if (checkbox.checked) {
        config.style.display = 'block';
        currentRecurringConfig.isRecurring = true;
    } else {
        config.style.display = 'none';
        currentRecurringConfig.isRecurring = false;
    }
};

// Switch recurring type
window.switchRecurringType = function () {
    const type = document.getElementById('recurring-type').value;
    currentRecurringConfig.type = type;

    // Hide all configs
    document.querySelectorAll('.recurring-type-config').forEach(el => {
        el.style.display = 'none';
    });

    // Show selected config
    document.getElementById(`recurring-${type}-config`).style.display = 'block';
};

// Get recurring configuration from form
function getRecurringConfig() {
    if (!currentRecurringConfig.isRecurring) {
        return null;
    }

    const config = {
        type: document.getElementById('recurring-type').value
    };

    if (config.type === 'daily') {
        config.interval = parseInt(document.getElementById('recurring-daily-interval').value) || 1;
    } else if (config.type === 'weekly') {
        const checkboxes = document.querySelectorAll('.weekdays-selector input[type="checkbox"]:checked');
        config.daysOfWeek = Array.from(checkboxes).map(cb => parseInt(cb.value));
    } else if (config.type === 'monthly') {
        config.dayOfMonth = document.getElementById('recurring-monthly-day').value;
    }

    return config;
}

// Load recurring configuration into form
function loadRecurringConfig(task) {
    const checkbox = document.getElementById('input-recurring');
    const config = document.getElementById('recurring-config');

    if (task.isRecurring && task.recurrence) {
        checkbox.checked = true;
        config.style.display = 'block';
        currentRecurringConfig.isRecurring = true;

        // Set type
        document.getElementById('recurring-type').value = task.recurrence.type;
        switchRecurringType();

        // Load type-specific config
        if (task.recurrence.type === 'daily') {
            document.getElementById('recurring-daily-interval').value = task.recurrence.interval || 1;
        } else if (task.recurrence.type === 'weekly' && task.recurrence.daysOfWeek) {
            task.recurrence.daysOfWeek.forEach(day => {
                const checkbox = document.querySelector(`.weekdays-selector input[value="${day}"]`);
                if (checkbox) checkbox.checked = true;
            });
        } else if (task.recurrence.type === 'monthly') {
            document.getElementById('recurring-monthly-day').value = task.recurrence.dayOfMonth || 1;
        }
    } else {
        checkbox.checked = false;
        config.style.display = 'none';
        currentRecurringConfig.isRecurring = false;
    }
}

// Clear recurring configuration
function clearRecurringConfig() {
    document.getElementById('input-recurring').checked = false;
    document.getElementById('recurring-config').style.display = 'none';
    document.getElementById('recurring-daily-interval').value = 1;
    document.querySelectorAll('.weekdays-selector input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('recurring-monthly-day').value = 1;
    currentRecurringConfig = {
        isRecurring: false,
        type: 'daily',
        dailyInterval: 1,
        weeklyDays: [],
        monthlyDay: 1
    };
}

// Calculate next occurrence date
function calculateNextDate(currentDate, recurrence) {
    const date = new Date(currentDate);

    if (recurrence.type === 'daily') {
        date.setDate(date.getDate() + (recurrence.interval || 1));
    } else if (recurrence.type === 'weekly') {
        // Find next day of week
        const currentDay = date.getDay();
        const daysOfWeek = recurrence.daysOfWeek.sort((a, b) => a - b);

        let nextDay = daysOfWeek.find(day => day > currentDay);
        if (!nextDay) {
            nextDay = daysOfWeek[0];
            date.setDate(date.getDate() + (7 - currentDay + nextDay));
        } else {
            date.setDate(date.getDate() + (nextDay - currentDay));
        }
    } else if (recurrence.type === 'monthly') {
        if (recurrence.dayOfMonth === 'last') {
            date.setMonth(date.getMonth() + 1);
            date.setDate(0); // Last day of month
        } else {
            date.setMonth(date.getMonth() + 1);
            date.setDate(parseInt(recurrence.dayOfMonth));
        }
    }

    return date.toISOString().split('T')[0];
}

// Initialize recurring system
function initRecurringSystem() {
    const checkbox = document.getElementById('input-recurring');
    const typeSelect = document.getElementById('recurring-type');

    if (checkbox) {
        checkbox.addEventListener('change', toggleRecurringConfig);
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', switchRecurringType);
    }
}
