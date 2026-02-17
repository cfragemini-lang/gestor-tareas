# Configuración del Template de EmailJS

## Problema Actual
El email no se envía correctamente. Necesitas configurar el template en EmailJS.

## Pasos para Configurar el Template:

### 1. Ve a EmailJS Dashboard
- https://dashboard.emailjs.com/admin/templates

### 2. Edita el Template `template_7lkhu18`

### 3. Configura las Variables del Template

**En la sección "Subject":**
```
📋 Tienes {{task_count}} tarea(s) pendiente(s)
```

**En la sección "Content" (HTML):**
Copia y pega EXACTAMENTE esto:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center; color: white; }
        .header h1 { margin: 0; color: #c5a059; font-size: 28px; }
        .content { padding: 30px; }
        .task-count { background: #c5a059; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .tasks { margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 40px; margin-bottom: 10px;">📋</div>
            <h1>Gestor de Tareas</h1>
            <p style="color: #94a3b8; margin: 10px 0 0 0;">Sistema de Gestión Premium</p>
        </div>
        
        <div class="content">
            <h2>¡Hola {{user_name}}! 👋</h2>
            <p>Tienes <strong>{{task_count}}</strong> tarea(s) que requieren tu atención.</p>
            
            <div class="task-count">
                📌 {{task_count}} Tarea(s) Pendiente(s)
            </div>
            
            <div class="tasks">
                {{{tasks_html}}}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://cfragemini-lang.github.io/gestor-tareas/" style="background: #c5a059; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Ver Todas las Tareas →
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>Este es un recordatorio automático de tu <strong>Gestor de Tareas Premium</strong>.</p>
            <p style="margin-top: 10px;">© 2026 Gestor de Tareas Premium</p>
        </div>
    </div>
</body>
</html>
```

### 4. Configurar "To email"
En la sección "To email", pon:
```
{{to_email}}
```

### 5. Guardar
Click en **"Save"**

---

## Prueba Después de Configurar

1. Recarga la página de tu app
2. Click en "📧 Notificar"
3. Escribe tu email
4. Click "Enviar Email"
5. Abre la consola (F12) y busca errores

Si sigue sin funcionar, copia el error de la consola y dímelo.
