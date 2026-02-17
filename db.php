<?php
// db.php
try {
    // Create (connect to) SQLite database in file
    $db = new PDO('sqlite:tasks.db');
    // Set errormode to exceptions
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create table if not exists (using the schema we defined)
    $db->exec("CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('pendiente', 'en_progreso', 'completado')) NOT NULL DEFAULT 'pendiente',
        priority TEXT CHECK(priority IN ('baja', 'media', 'alta')) NOT NULL DEFAULT 'media',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
    exit;
}
?>
