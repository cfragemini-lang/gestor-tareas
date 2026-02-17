
// ========== EMAIL NOTIFICATIONS (EmailJS) ==========

// Initialize EmailJS
(function () {
    emailjs.init("dqsisHORTfMnNHDS3"); // Public Key
})();

// Email Modal Functions
window.closeEmailModal = function () {
    document.getElementById('email-modal').style.display = 'none';
    document.getElementById('email-to').value = '';
};

window.openEmailModal = function () {
    const tasks = window.tasks || [];
    const pendingTasks = tasks.filter(t => t.status === 'pendiente');

    if (pendingTasks.length === 0) {
        alert('No hay tareas pendientes para notificar.');
        return;
    }

    // Show preview
    const preview = document.getElementById('selected-tasks-preview');
    preview.innerHTML = `
        <p style="color: #c5a059; font-weight: 600; margin-bottom: 0.5rem;">
            ${pendingTasks.length} tarea(s) pendiente(s):
        </p>
        ${pendingTasks.slice(0, 5).map(t => `
            <div style="padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 0.5rem;">
                <div style="font-weight: 600; color: white;">${t.title}</div>
                <div style="font-size: 0.85rem; color: #94a3b8;">
                    ${t.due_date ? '📅 ' + t.due_date : 'Sin fecha'}
                </div>
            </div>
        `).join('')}
        ${pendingTasks.length > 5 ? `<p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.5rem;">... y ${pendingTasks.length - 5} más</p>` : ''}
    `;

    document.getElementById('email-modal').style.display = 'flex';
};

// Send Email Notification
window.sendEmailNotification = async function () {
    const emailTo = document.getElementById('email-to').value.trim();

    if (!emailTo) {
        alert('Por favor ingresa un correo destino.');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTo)) {
        alert('Por favor ingresa un correo válido.');
        return;
    }

    const tasks = window.tasks || [];
    const pendingTasks = tasks.filter(t => t.status === 'pendiente');

    if (pendingTasks.length === 0) {
        alert('No hay tareas pendientes para notificar.');
        return;
    }

    // Generate tasks HTML for email
    const tasksHtml = pendingTasks.map(task => {
        const priorityClass = `priority-${task.priority}`;
        const priorityText = {
            'alta': 'ALTA',
            'media': 'MEDIA',
            'baja': 'BAJA'
        }[task.priority] || 'MEDIA';

        const statusClass = `status-${task.status}`;
        const statusText = {
            'pendiente': 'Pendiente',
            'en_progreso': 'En Progreso',
            'completado': 'Completado'
        }[task.status] || 'Pendiente';

        return `
            <tr>
                <td>
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.due_date ? `<div class="task-date">📅 Vence: ${task.due_date}</div>` : ''}
                </td>
                <td>
                    <span class="priority-badge ${priorityClass}">${priorityText}</span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
            </tr>
        `;
    }).join('');

    // Email parameters
    const userName = window.userName || document.querySelector('.user-name');
    const templateParams = {
        to_email: emailTo,
        task_count: pendingTasks.length,
        tasks_html: tasksHtml,
        user_name: userName ? (userName.textContent || 'Usuario') : 'Usuario'
    };

    console.log('Sending email with params:', templateParams);

    // Show loading
    const sendButton = event.target;
    const originalText = sendButton.innerHTML;
    sendButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    sendButton.disabled = true;

    try {
        const response = await emailjs.send(
            'service_odbzwza',      // Service ID
            'template_7lkhu18',     // Template ID
            templateParams
        );

        console.log('Email sent successfully:', response);
        alert(`✅ Email enviado exitosamente a ${emailTo}\n\nRevisa tu bandeja de entrada (puede tardar 1-2 minutos).`);
        closeEmailModal();
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Error details:', error.text || error.message);
        alert(`❌ Error al enviar el email:\n${error.text || error.message}\n\nVerifica la configuración de EmailJS.`);
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
    }
};
