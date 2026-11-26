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

INSERT OR IGNORE INTO categories (id, name, icon) VALUES
('chizzi', 'Chizzi Chizz', '🧀'),
('lavash', 'Lavash', '🌯'),
('shaurma', 'Shaurma', '🥙'),
('burger', 'Burger', '🍔'),
('xot-dog', 'Xot Dog', '🌭'),
('salatlar', 'Salatlar', '🥗'),
('ichimliklar', 'Ichimliklar', '🥤');
