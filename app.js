// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const tasksCollection = collection(db, "tasks");

// DOM Elements
const modal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const btnNewTask = document.getElementById('btn-new-task');
const closeModal = document.querySelector('.close-modal');
const closeModalBtn = document.querySelector('.close-modal-btn');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('searchInput');

// State
let tasks = [];
let isEditing = false;
let currentTaskId = null;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    subscribeToTasks(); // Real-time listener
});

function setupEventListeners() {
    // Modal controls
    btnNewTask.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Form Submit
    taskForm.addEventListener('submit', handleFormSubmit);

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        renderFilteredTasks(term);
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('light-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Expose functions to window (since we are a module now)
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
            alert('Error al eliminar: ' + err.message);
        }
    };
}

// Real-time listener
function subscribeToTasks() {
    const q = query(tasksCollection, orderBy("created_at", "desc"));

    onSnapshot(q, (snapshot) => {
        tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderTasks(tasks);
    }, (error) => {
        console.error("Error getting tasks: ", error);
        if (error.code === 'permission-denied') {
            alert('Error de Permisos: Asegurate de configurar las reglas de Firestore en modo prueba, consulta la guia de seguridad.');
        } else {
            document.querySelector('.kanban-board').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ef4444;"><h3>Error de Conexión</h3><p>Verifica tu configuración de Firebase en app.js</p></div>';
        }
    });
}

function renderFilteredTasks(term) {
    if (!term) {
        renderTasks(tasks);
        return;
    }
    const filtered = tasks.filter(t =>
        t.title.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term))
    );
    renderTasks(filtered);
}

function renderTasks(tasksToRender) {
    // Clear columns
    ['pendiente', 'en_progreso', 'completado'].forEach(status => {
        const list = document.getElementById(`list-${status}`);
        const count = document.querySelector(`#col-${status} .count`);
        if (list) {
            list.innerHTML = '';
            // Filter tasks for this column
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
    div.draggable = true;

    // Date formatting
    const dateStr = task.due_date ? new Date(task.due_date).toLocaleDateString() : '';

    div.innerHTML = `
        <div class="task-tags">
            <span class="tag tag-priority-${task.priority}">${task.priority}</span>
            ${dateStr ? `<span class="tag" style="background:rgba(255,255,255,0.1)"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>` : ''}
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-desc">${task.description || ''}</div>
        <div class="task-footer">
            <span>#${task.id.substr(0, 4)}</span> <!-- Short ID for visual -->
            <div class="task-actions">
                <button class="action-btn" onclick="editTask('${task.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;
    return div;
}

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
    } else {
        taskForm.reset();
        document.getElementById('input-priority').value = 'media';
        document.getElementById('input-status').value = 'pendiente';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const taskData = {
        title: document.getElementById('input-title').value,
        description: document.getElementById('input-desc').value,
        priority: document.getElementById('input-priority').value,
        status: document.getElementById('input-status').value,
        due_date: document.getElementById('input-date').value,
    };

    try {
        if (isEditing) {
            const taskRef = doc(db, "tasks", currentTaskId);
            await updateDoc(taskRef, taskData);
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
