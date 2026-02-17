// app.js
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

// Auth Provider
const provider = new GoogleAuthProvider();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appContainer = document.querySelector('.app-container');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const userAvatar = document.querySelector('.user-avatar');
const userName = document.querySelector('.user-name');

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
let currentUser = null;
let unsubscribe = null; // To stop listener on logout

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Auth Listener handles flow
});

// Auth Flow
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Logged In
        currentUser = user;
        loginScreen.style.opacity = '0';
        setTimeout(() => loginScreen.style.display = 'none', 500);

        // Show User Info
        userInfo.style.display = 'flex';
        userName.textContent = user.displayName;
        userAvatar.src = user.photoURL;

        // Load tasks
        subscribeToTasks(user.uid);
    } else {
        // Logged Out
        currentUser = null;
        loginScreen.style.display = 'flex';
        setTimeout(() => loginScreen.style.opacity = '1', 10);

        userInfo.style.display = 'none';

        // Clear tasks
        if (unsubscribe) unsubscribe();
        renderTasks([]);
    }
});

function login() {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Logged in:", result.user.displayName);
        }).catch((error) => {
            console.error(error);
            alert("Error al iniciar sesión: " + error.message);
        });
}

function logout() {
    if (confirm("¿Cerrar sesión?")) {
        signOut(auth);
    }
}

function setupEventListeners() {
    // Auth
    btnLogin.addEventListener('click', login);
    btnLogout.addEventListener('click', logout);

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

    // Global Functions
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
function subscribeToTasks(userId) {
    if (unsubscribe) unsubscribe();

    // Query: Tasks created by THIS user, ordered by date
    // Note: This requires a Compound Query Index in Firestore (userId + created_at)
    // If it fails initially, we'll strip the orderBy temporary or guide user to create index
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
        renderTasks(tasks);
    }, (error) => {
        console.error("Error getting tasks: ", error);
        if (error.code === 'failed-precondition') {
            // Index missing error - typical in Firebase
            console.warn("Index needed. Providing link.");
            alert("Para ordenar las tareas, Firebase necesita crear un 'Índice'. Abre la consola (F12) para ver el enlace de creación.");
        } else if (error.code === 'permission-denied') {
            alert('Error de Permisos: Revisa las reglas de seguridad.');
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

    const dateStr = task.due_date ? new Date(task.due_date).toLocaleDateString() : '';

    div.innerHTML = `
        <div class="task-tags">
            <span class="tag tag-priority-${task.priority}">${task.priority}</span>
            ${dateStr ? `<span class="tag" style="background:rgba(255,255,255,0.1)"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>` : ''}
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-desc">${task.description || ''}</div>
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
        userId: currentUser.uid // IMPORTANT: Link task to user
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
