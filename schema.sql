
-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('pendiente', 'en_progreso', 'completado')) NOT NULL DEFAULT 'pendiente',
    priority TEXT CHECK(priority IN ('baja', 'media', 'alta')) NOT NULL DEFAULT 'media',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some dummy data for initial testing
INSERT INTO tasks (title, description, status, priority, due_date) VALUES 
('Planificar Proyecto', 'Definir requerimientos y alcance', 'completado', 'alta', DATE('now')),
('Diseñar Base de Datos', 'Crear esquema SQL', 'en_progreso', 'alta', DATE('now', '+1 day')),
('Implementar API', 'Desarrollar backend PHP', 'pendiente', 'media', DATE('now', '+2 days'));
