<?php
// api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM tasks ORDER BY created_at DESC");
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($tasks);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if(isset($data['title'])) {
            $stmt = $db->prepare("INSERT INTO tasks (title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['title'], 
                $data['description'] ?? '', 
                $data['status'] ?? 'pendiente', 
                $data['priority'] ?? 'media',
                $data['due_date'] ?? null
            ]);
            echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Tarea creada']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Titulo requerido']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if(isset($data['id'])) {
            // Build dynamic update query
            $fields = [];
            $values = [];
            foreach(['title', 'description', 'status', 'priority', 'due_date'] as $field) {
                if(isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if(count($fields) > 0) {
                $values[] = $data['id']; // Add ID for WHERE clause
                $sql = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute($values);
                echo json_encode(['message' => 'Tarea actualizada']);
            } else {
                echo json_encode(['message' => 'Nada que actualizar']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if($id) {
            $stmt = $db->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Tarea eliminada']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
        }
        break;
}
?>
