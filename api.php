<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$databaseFile = __DIR__ . '/evos.sqlite';

try {
    $pdo = new PDO('sqlite:' . $databaseFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['error' => 'SQLite bazasiga ulanib bo\'lmadi'], JSON_UNESCAPED_UNICODE);
    exit;
}

$pdo->exec("
    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS analytics (
        event_key TEXT PRIMARY KEY,
        event_value INTEGER NOT NULL DEFAULT 0
    );
");

$categoryCount = (int) $pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();
if ($categoryCount === 0) {
    $pdo->exec("
        INSERT INTO categories (id, name, icon) VALUES
        ('chizzi', 'Chizzi Chizz', '🧀'),
        ('lavash', 'Lavash', '🌯'),
        ('shaurma', 'Shaurma', '🥙'),
        ('burger', 'Burger', '🍔'),
        ('xot-dog', 'Xot Dog', '🌭'),
        ('salatlar', 'Salatlar', '🥗'),
        ('ichimliklar', 'Ichimliklar', '🥤');
    ");
}

$productCount = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
if ($productCount === 0) {
    $pdo->exec("
        INSERT INTO products (id, category_id, name, description, price, image_url) VALUES
        ('seed-1', 'lavash', 'Macho lavash', 'Mazali mol go`shtli lavash', 63000, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600'),
        ('seed-2', 'lavash', 'Mol go`shtli lavash L', 'Mol go`shti va yangi masalliqlar', 42000, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600'),
        ('seed-3', 'burger', 'Chizburger', 'Pishloqli klassik burger', 30000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600'),
        ('seed-4', 'ichimliklar', 'Coca-Cola 0.5L', 'Gazli ichimlik', 12000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600');
    ");
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $path)));
$resourceIndex = array_search('api.php', $segments, true);
$resource = $resourceIndex !== false ? ($segments[$resourceIndex + 1] ?? '') : '';
$productId = $resourceIndex !== false ? ($segments[$resourceIndex + 2] ?? '') : '';

function sendJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function readBody(): array
{
    $body = json_decode((string) file_get_contents('php://input'), true);
    return is_array($body) ? $body : [];
}

if ($resource === 'categories' && $method === 'GET') {
    $rows = $pdo->query('SELECT id, name, icon FROM categories ORDER BY rowid')->fetchAll(PDO::FETCH_ASSOC);
    sendJson(['categories' => $rows]);
}

if ($resource === 'products' && $method === 'GET') {
    $rows = $pdo->query("
        SELECT id, category_id AS category, name, description, price, image_url AS image
        FROM products
        WHERE is_active = 1
        ORDER BY rowid DESC
    ")->fetchAll(PDO::FETCH_ASSOC);
    sendJson(['products' => $rows]);
}

if ($resource === 'products' && $method === 'POST') {
    $body = readBody();
    $name = trim((string) ($body['name'] ?? ''));
    $category = trim((string) ($body['category'] ?? ''));
    $price = (int) ($body['price'] ?? 0);
    if ($name === '' || $category === '' || $price <= 0) {
        sendJson(['error' => 'Noto`g`ri mahsulot ma`lumotlari'], 422);
    }
    $id = 'item-' . bin2hex(random_bytes(8));
    $statement = $pdo->prepare("
        INSERT INTO products (id, category_id, name, description, price, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $statement->execute([
        $id,
        $category,
        $name,
        trim((string) ($body['description'] ?? '')),
        $price,
        trim((string) ($body['image'] ?? ''))
    ]);
    sendJson(['success' => true, 'id' => $id], 201);
}

if ($resource === 'products' && $method === 'PUT' && $productId !== '') {
    $body = readBody();
    $statement = $pdo->prepare("
        UPDATE products
        SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?
        WHERE id = ?
    ");
    $statement->execute([
        trim((string) ($body['category'] ?? '')),
        trim((string) ($body['name'] ?? '')),
        trim((string) ($body['description'] ?? '')),
        (int) ($body['price'] ?? 0),
        trim((string) ($body['image'] ?? '')),
        $productId
    ]);
    sendJson(['success' => true]);
}

if ($resource === 'products' && $method === 'DELETE' && $productId !== '') {
    $statement = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $statement->execute([$productId]);
    sendJson(['success' => true]);
}

if ($resource === 'analytics' && $method === 'GET') {
    $rows = $pdo->query('SELECT event_key, event_value FROM analytics')->fetchAll(PDO::FETCH_ASSOC);
    $analytics = ['visits' => 0, 'exits' => 0, 'orderClicks' => 0];
    foreach ($rows as $row) {
        $analytics[$row['event_key']] = (int) $row['event_value'];
    }
    sendJson($analytics);
}

if ($resource === 'analytics' && $method === 'POST') {
    $body = readBody();
    $key = trim((string) ($body['key'] ?? ''));
    if (!in_array($key, ['visits', 'exits', 'orderClicks'], true)) {
        sendJson(['error' => 'Noto`g`ri statistika kaliti'], 422);
    }
    $statement = $pdo->prepare("
        INSERT INTO analytics (event_key, event_value)
        VALUES (?, 1)
        ON CONFLICT(event_key) DO UPDATE SET event_value = event_value + 1
    ");
    $statement->execute([$key]);
    sendJson(['success' => true]);
}

sendJson(['error' => 'Noma`lum API so`rovi'], 404);
