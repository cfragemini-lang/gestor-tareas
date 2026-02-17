// app.js - Gestor de Tareas Premium con Funcionalidades Avanzadas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBuugJnjNoqN_zRICmgpUiDUAF36XAxvWI",
    authDomain: "mi-gestor-tareas-66937.firebaseapp.com",
    projectId: "mi-gestor-tareas-66937",
    storageBucket: "mi-gestor-tareas-66937.firebasestorage.app",
    messagingSenderId: "362228108615",
    appId: "1:362228108615:web:4244e475c9c0584376d062",
    measurementId: "G-2Q085FCDTX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const tasksCollection = collection(db, "tasks");
const provider = new GoogleAuthProvider();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const userAvatar = document.querySelector('.user-avatar');
const userName = document.querySelector('.user-name');
const modal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const btnNewTask = document.getElementById('btn-new-task');
const btnNotify = document.getElementById('btn-notify');
const btnExport = document.getElementById('btn-export');
const closeModal = document.querySelector('.close-modal');
const closeModalBtn = document.querySelector('.close-modal-btn');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('searchInput');
const filterMonth = document.getElementById('filter-month');
const filterYear = document.getElementById('filter-year');
const btnClearFilters = document.getElementById('btn-clear-filters');

// State
let tasks = [];
let isEditing = false;
let currentTaskId = null;
let currentUser = null;
let unsubscribe = null;
let priorityChart = null;
let weeklyChart = null;
let currentFilters = {
    search: '',
    month: '',
    year: ''
};

// Make tasks globally accessible for email functions
window.tasks = tasks;
window.userName = userName;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeCharts();
    initTagsSystem(); // Initialize tags system
});

// Auth Flow
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loginScreen.style.opacity = '0';
        setTimeout(() => loginScreen.style.display = 'none', 500);

        userInfo.style.display = 'flex';
        userName.textContent = user.displayName;
        userAvatar.src = user.photoURL;

        subscribeToTasks(user.uid);
    } else {
        currentUser = null;
        loginScreen.style.display = 'flex';
        setTimeout(() => loginScreen.style.opacity = '1', 10);

        userInfo.style.display = 'none';

        if (unsubscribe) unsubscribe();
        renderTasks([]);
        updateMetrics([]);
    }
});

function login() {
    signInWithPopup(auth, provider)
        .then((result) => console.log("Logged in:", result.user.displayName))
        .catch((error) => alert("Error al iniciar sesión: " + error.message));
}

function logout() {
    if (confirm("¿Cerrar sesión?")) signOut(auth);
}

function setupEventListeners() {
    btnLogin.addEventListener('click', login);
    btnLogout.addEventListener('click', logout);
    btnNewTask.addEventListener('click', () => openModal());
    btnNotify.addEventListener('click', openEmailModal);
    btnExport.addEventListener('click', showExportMenu);
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    taskForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        applyFilters();
    });

    filterMonth.addEventListener('change', (e) => {
        currentFilters.month = e.target.value;
        applyFilters();
    });

    filterYear.addEventListener('change', (e) => {
        currentFilters.year = e.target.value;
        applyFilters();
    });

    btnClearFilters.addEventListener('click', () => {
        currentFilters = { search: '', month: '', year: '' };
        searchInput.value = '';
        filterMonth.value = '';
        filterYear.value = '';
        applyFilters();
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });

    window.editTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) openModal(task);
    };

    window.deleteTask = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
        try {
            await deleteDoc(doc(db, "tasks", id));
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };
}

// Real-time listener
function subscribeToTasks(userId) {
    if (unsubscribe) unsubscribe();

    const q = query(
        tasksCollection,
        where("userId", "==", userId),
        orderBy("created_at", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        window.tasks = tasks; // Make tasks globally accessible
        populateYearFilter();
        applyFilters();
        updateMetrics(tasks);
        updateCharts(tasks);
        initializeDragAndDrop();
    }, (error) => {
        console.error("Error getting tasks: ", error);
    });
}

// Populate year filter dynamically
function populateYearFilter() {
    const years = new Set();
    tasks.forEach(task => {
        if (task.due_date) {
            let year;
            if (task.due_date.includes('-')) {
                // Format: YYYY-MM-DD
                year = new Date(task.due_date).getFullYear();
            } else {
                // Format: M/D/YYYY or MM/DD/YYYY
                const parts = task.due_date.split('/');
                year = parseInt(parts[2]); // Year is the third part
            }
            years.add(year);
        }
        if (task.created_at && task.created_at.toDate) {
            const year = task.created_at.toDate().getFullYear();
            years.add(year);
        }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    filterYear.innerHTML = '<option value="">Todos los años</option>';
    sortedYears.forEach(year => {
        filterYear.innerHTML += `<option value="${year}">${year}</option>`;
    });
}

// Apply all filters
function applyFilters() {
    let filtered = [...tasks];

    // Search filter
    if (currentFilters.search) {
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(currentFilters.search) ||
            (t.description && t.description.toLowerCase().includes(currentFilters.search))
        );
    }

    // Month/Year filter
    if (currentFilters.month !== '' || currentFilters.year !== '') {
        filtered = filtered.filter(t => {
            if (!t.due_date) return false;

            // Parse date correctly - handle both formats
            let taskDate;
            if (t.due_date.includes('-')) {
                // Format: YYYY-MM-DD
                taskDate = new Date(t.due_date);
            } else {
                // Format: M/D/YYYY or MM/DD/YYYY
                const parts = t.due_date.split('/');
                // JavaScript Date expects: new Date(year, monthIndex, day)
                // monthIndex is 0-based (0=January, 11=December)
                taskDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            }

            const monthMatch = currentFilters.month === '' || taskDate.getMonth() === parseInt(currentFilters.month);
            const yearMatch = currentFilters.year === '' || taskDate.getFullYear() === parseInt(currentFilters.year);

            return monthMatch && yearMatch;
        });
    }

    renderTasks(filtered);
    updateMetrics(filtered);  // Update metrics with filtered tasks
    updateCharts(filtered);   // Update charts with filtered tasks
}


function renderFilteredTasks(term) {
    currentFilters.search = term;
    applyFilters();
}

function renderTasks(tasksToRender) {
    ['pendiente', 'en_progreso', 'completado'].forEach(status => {
        const list = document.getElementById(`list-${status}`);
        const count = document.querySelector(`#col-${status} .count`);
        if (list) {
            list.innerHTML = '';
            const columnTasks = tasksToRender.filter(t => t.status === status);
            if (count) count.textContent = columnTasks.length;

            columnTasks.forEach(task => {
                const card = createTaskCard(task);
                list.appendChild(card);
            });
        }
    });
}

function createTaskCard(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.dataset.id = task.id;

    const dateStr = task.due_date ? new Date(task.due_date).toLocaleDateString() : '';

    div.innerHTML = `
        <div class="task-tags">
            <span class="tag tag-priority-${task.priority}">${task.priority}</span>
            ${dateStr ? `<span class="tag" style="background:rgba(255,255,255,0.1)"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>` : ''}
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-desc">${task.description || ''}</div>
        ${renderTaskTags(task.tags)}
        <div class="task-footer">
            <span>#${task.id.substr(0, 4)}</span>
            <div class="task-actions">
                <button class="action-btn" onclick="editTask('${task.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;
    return div;
}

// ========== DRAG & DROP ==========
function initializeDragAndDrop() {
    ['pendiente', 'en_progreso', 'completado'].forEach(status => {
        const list = document.getElementById(`list-${status}`);
        if (list && !list.sortableInstance) {
            list.sortableInstance = Sortable.create(list, {
                group: 'tasks',
                animation: 200,
                ghostClass: 'task-ghost',
                dragClass: 'task-dragging',
                onEnd: async (evt) => {
                    const taskId = evt.item.dataset.id;
                    const newStatus = evt.to.id.replace('list-', '');

                    try {
                        await updateDoc(doc(db, "tasks", taskId), {
                            status: newStatus
                        });
                    } catch (err) {
                        console.error('Error updating task status:', err);
                    }
                }
            });
        }
    });
}

// ========== DASHBOARD METRICS ==========
function updateMetrics(tasksData) {
    const pending = tasksData.filter(t => t.status === 'pendiente').length;
    const progress = tasksData.filter(t => t.status === 'en_progreso').length;
    const completed = tasksData.filter(t => t.status === 'completado').length;
    const total = tasksData.length;
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('metric-pending').textContent = pending;
    document.getElementById('metric-progress').textContent = progress;
    document.getElementById('metric-completed').textContent = completed;
    document.getElementById('metric-productivity').textContent = productivity + '%';
}

// ========== CHARTS ==========
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: { color: '#f8fafc' }
            }
        }
    };

    // Priority Chart (Doughnut)
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    priorityChart = new Chart(priorityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Alta', 'Media', 'Baja'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        },
        options: chartOptions
    });

    // Weekly Chart (Line)
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Tareas Completadas',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#c5a059',
                backgroundColor: 'rgba(197, 160, 89, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

function updateCharts(tasksData) {
    // Update Priority Chart
    const alta = tasksData.filter(t => t.priority === 'alta').length;
    const media = tasksData.filter(t => t.priority === 'media').length;
    const baja = tasksData.filter(t => t.priority === 'baja').length;

    priorityChart.data.datasets[0].data = [alta, media, baja];
    priorityChart.update();

    // Update Monthly Progress Chart
    const completedTasks = tasksData.filter(t => t.status === 'completado');

    // If filtering by specific month, show weekly breakdown
    if (currentFilters.month !== '') {
        const weeklyData = [0, 0, 0, 0]; // 4 weeks
        weeklyChart.data.labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];

        completedTasks.forEach(task => {
            if (task.due_date) {
                let taskDate;
                if (task.due_date.includes('-')) {
                    taskDate = new Date(task.due_date);
                } else {
                    const parts = task.due_date.split('/');
                    taskDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                }

                const day = taskDate.getDate();
                const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
                weeklyData[weekIndex]++;
            }
        });

        weeklyChart.data.datasets[0].data = weeklyData;
    } else {
        // Show all 7 days of the week
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];
        weeklyChart.data.labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        completedTasks.forEach(task => {
            if (task.created_at && task.created_at.toDate) {
                const day = task.created_at.toDate().getDay();
                weeklyData[day === 0 ? 6 : day - 1]++;
            }
        });

        weeklyChart.data.datasets[0].data = weeklyData;
    }

    weeklyChart.update();
}

// ========== EXPORT FUNCTIONALITY ==========
function showExportMenu() {
    document.getElementById('export-modal').style.display = 'flex';
}

function closeExportModal() {
    document.getElementById('export-modal').style.display = 'none';
}

function handleExportPDF() {
    exportToPDF();
    closeExportModal();
}

function handleExportExcel() {
    exportToExcel();
    closeExportModal();
}

// Make functions globally accessible
window.closeExportModal = closeExportModal;
window.handleExportPDF = handleExportPDF;
window.handleExportExcel = handleExportExcel;

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(197, 160, 89);
    doc.text('Gestor de Tareas - Reporte', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Usuario: ${currentUser.displayName}`, 14, 33);

    // Table
    const tableData = tasks.map(t => [
        t.title,
        t.priority,
        t.status.replace('_', ' '),
        t.due_date || 'Sin fecha',
        (t.tags && t.tags.length > 0) ? t.tags.join(', ') : '-',
        (t.description || '').substring(0, 40)
    ]);

    doc.autoTable({
        startY: 40,
        head: [['Tarea', 'Prioridad', 'Estado', 'Fecha', 'Tags', 'Descripción']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [197, 160, 89] },
        styles: { fontSize: 8 }
    });

    doc.save(`tareas_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportToExcel() {
    const data = tasks.map(t => ({
        'Título': t.title,
        'Descripción': t.description || '',
        'Prioridad': t.priority,
        'Estado': t.status.replace('_', ' '),
        'Fecha Límite': t.due_date || '',
        'Tags': (t.tags && t.tags.length > 0) ? t.tags.join(', ') : '-',
        'Creada': t.created_at ? new Date(t.created_at.toDate()).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tareas");

    XLSX.writeFile(wb, `tareas_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ========== MODAL & FORM ==========
function openModal(task = null) {
    modal.style.display = 'flex';
    isEditing = !!task;
    currentTaskId = task ? task.id : null;

    document.getElementById('modal-title').textContent = isEditing ? 'Editar Tarea' : 'Nueva Tarea';

    if (task) {
        document.getElementById('input-title').value = task.title;
        document.getElementById('input-desc').value = task.description || '';
        document.getElementById('input-priority').value = task.priority;
        document.getElementById('input-status').value = task.status;
        document.getElementById('input-date').value = task.due_date || '';

        // Load tags
        currentTags = task.tags || [];
        renderTagsChips();
    } else {
        taskForm.reset();
        document.getElementById('input-priority').value = 'media';
        document.getElementById('input-status').value = 'pendiente';

        // Clear tags
        currentTags = [];
        renderTagsChips();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        alert("Debes iniciar sesión para crear tareas.");
        return;
    }

    const taskData = {
        title: document.getElementById('input-title').value,
        description: document.getElementById('input-desc').value,
        priority: document.getElementById('input-priority').value,
        status: document.getElementById('input-status').value,
        due_date: document.getElementById('input-date').value,
        tags: currentTags, // Include tags
        userId: currentUser.uid
    };

    try {
        if (isEditing) {
            await updateDoc(doc(db, "tasks", currentTaskId), taskData);
        } else {
            taskData.created_at = serverTimestamp();
            await addDoc(tasksCollection, taskData);
        }

        modal.style.display = 'none';
    } catch (err) {
        console.error('Error saving task:', err);
        alert('Error al guardar: ' + err.message);
    }
}
