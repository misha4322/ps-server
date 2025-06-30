-- Создание таблиц
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Components (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK(category IN (
        'processor', 'motherboard', 'memory', 'cooling', 
        'video_card', 'power_supply', 'storage', 'case'
    )),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    socket VARCHAR(50),
    brand VARCHAR(50)
);

CREATE TABLE Builds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL DEFAULT 'default_build.jpg',
    total_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Build_Components (
    build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
    component_id INT NOT NULL REFERENCES Components(id) ON DELETE CASCADE,
    PRIMARY KEY (build_id, component_id)
);

CREATE TABLE Cart (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
    UNIQUE (user_id, build_id)
);

CREATE TABLE Favorite (
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, build_id)
);

CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20) NOT NULL,
    total DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Order_Builds (
    order_id INT NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (order_id, build_id)
);

-- Индексы
CREATE INDEX idx_build_components_build ON Build_Components(build_id);
CREATE INDEX idx_build_components_component ON Build_Components(component_id);
CREATE INDEX idx_cart_user ON Cart(user_id);
CREATE INDEX idx_favorite_user ON Favorite(user_id);
CREATE INDEX idx_orders_user ON Orders(user_id);

-- Вставка компонентов 
INSERT INTO Components (category, name, price, brand, socket) VALUES
  ('processor', 'Intel Core i3-13100 [до 4.4GHz, 4 ядра]',       15000, 'Intel', 'LGA 1700'),
  ('processor', 'AMD Ryzen 5 7600X [до 5.3GHz, 6 ядер]',         40000, 'AMD',   'Socket AM5'),
  ('processor', 'Intel Core i5-13600K [до 5.1GHz, 14 потоков]',   50000, 'Intel', 'LGA 1700'),
  ('processor', 'Intel Core i7-13700K [до 5.4GHz, 16 потоков]',   70000, 'Intel', 'LGA 1700'),
  ('processor', 'AMD Ryzen 7 7800X3D [до 5.0GHz, 8 ядер]',       55000, 'AMD',   'Socket AM5'),
  ('processor', 'Intel Core i9-13900K [до 5.8GHz, 24 потока]',   90000, 'Intel', 'LGA 1700'),
  ('processor', 'AMD Ryzen 9 5900X [до 4.8GHz, 12 ядер]',        75000, 'AMD',   'Socket AM4'),
  ('processor', 'AMD Ryzen 9 7950X3D [до 5.7GHz, 16 ядер]',      80000, 'AMD',   'Socket AM5'),
  ('processor', 'AMD Ryzen 9 9950Х [до 5.7GHz, 16 ядер]',       100000, 'AMD',   'Socket AM5'),

  ('video_card', 'GIGABYTE GeForce GTX 1660 SUPER',               25000, 'GIGABYTE', NULL),
  ('video_card', 'MSI GeForce RTX 3050 VENTUS 2X',                35000, 'MSI', NULL),
  ('video_card', 'MSI GeForce RTX 4060 Ti TUF GAMING',            70000, 'MSI', NULL),
  ('video_card', 'ASUS GeForce RTX 4060 Ti TUF GAMING',           70000, 'ASUS', NULL),
  ('video_card', 'ZOTAC GeForce RTX 3060 Twin Edge OC',           55000, 'ZOTAC', NULL),
  ('video_card', 'MSI GeForce RTX 3070 SUPRIM X',                 95000, 'MSI', NULL),
  ('video_card', 'EVGA GeForce RTX 3070 XC3 Ultra Gaming',        80000, 'EVGA', NULL),
  ('video_card', 'MSI GeForce RTX 4080 SUPER GAMING SLIM WHITE', 120000, 'MSI', NULL),
  ('video_card', 'MSI GeForce RTX 4090 SUPRIM',                  250000, 'MSI', NULL),

  ('memory', '8GB HyperX Fury DDR4',                              6000, 'HyperX', NULL),
  ('memory', '16GB Corsair Vengeance LPX DDR4',                  10000, 'Corsair', NULL),
  ('memory', '16GB Corsair Vengeance RGB Pro DDR4',              12000, 'Corsair', NULL),
  ('memory', '32GB Kingston Fury Beast RGB',                     20000, 'Kingston', NULL),
  ('memory', '32GB G.Skill Trident Z Royal DDR4',                25000, 'G.Skill', NULL),
  ('memory', '32GB TEAMGROUP T-Force Delta RGB White',           30000, 'TEAMGROUP', NULL),
  ('memory', '64GB Crucial Ballistix RGB DDR4',                  35000, 'Crucial', NULL),
  ('memory', '64GB Corsair Vengeance LPX DDR4',                  32000, 'Corsair', NULL),
  ('memory', '64GB G.Skill Ripjaws V DDR5',                      45000, 'G.Skill', NULL),

  ('case', 'Cooler Master MasterBox Q300L',                       8000, 'Cooler Master', NULL),
  ('case', 'Phanteks Eclipse P400A',                             12000, 'Phanteks', NULL),
  ('case', 'NZXT H7 Elite',                                      15000, 'NZXT', NULL),
  ('case', 'Be Quiet! Pure Base 500DX',                          14000, 'Be Quiet!', NULL),
  ('case', 'Lian Li PC-O11 Dynamic',                             19000, 'Lian Li', NULL),
  ('case', 'Corsair 5000D AIRFLOW',                              18000, 'Corsair', NULL),
  ('case', 'Fractal Design Meshify 2',                           22000, 'Fractal Design', NULL),
  ('case', 'Thermaltake H200 TG',                                11000, 'Thermaltake', NULL),
  ('case', 'Cooler Master HAF 700',                              25000, 'Cooler Master', NULL),

  ('power_supply', 'Cooler Master MWE Gold 650W',                 7500, 'Cooler Master', NULL),
  ('power_supply', 'XPG Core Reactor 750W',                       9500, 'XPG', NULL),
  ('power_supply', 'Corsair RM750x',                              8500, 'Corsair', NULL),
  ('power_supply', 'SilverStone Strider 750W',                    8500, 'SilverStone', NULL),
  ('power_supply', 'EVGA SuperNOVA 750 G5',                      10000, 'EVGA', NULL),
  ('power_supply', 'Thermaltake Toughpower GF1 850W',            12000, 'Thermaltake', NULL),
  ('power_supply', 'Corsair RM1000x',                            12000, 'Corsair', NULL),
  ('power_supply', 'Seasonic PRIME TX-850',                      14000, 'Seasonic', NULL),
  ('power_supply', 'be quiet! Dark Power Pro 12 850W',           18000, 'be quiet!', NULL),

  ('cooling', 'be quiet! Pure Rock 2',                            5000, 'be quiet!', NULL),
  ('cooling', 'Arctic Freezer 34 eSports',                        6000, 'Arctic', NULL),
  ('cooling', 'Cooler Master Hyper 212 Black Edition',            4000, 'Cooler Master', NULL),
  ('cooling', 'NZXT Kraken X53',                                 15000, 'NZXT', NULL),
  ('cooling', 'be quiet! Dark Rock Pro 4',                        9000, 'be quiet!', NULL),
  ('cooling', 'Cooler Master MasterLiquid ML360R',               15000, 'Cooler Master', NULL),
  ('cooling', 'Noctua NH-D15',                                  20000, 'Noctua', NULL),
  ('cooling', 'Corsair iCUE H150i ELITE CAPELLIX',               20000, 'Corsair', NULL),
  ('cooling', 'NZXT Kraken Z73',                                 25000, 'NZXT', NULL),

  ('storage', 'Seagate BarraCuda 2TB HDD',                       5000, 'Seagate', NULL),
  ('storage', 'ADATA XPG SX8200 Pro 512GB SSD',                  7000, 'ADATA', NULL),
  ('storage', 'Western Digital Blue 500GB SSD',                  6000, 'WD', NULL),
  ('storage', 'Kingston NV2 1TB NVMe SSD',                       8000, 'Kingston', NULL),
  ('storage', 'Crucial P3 1TB NVMe SSD',                         9000, 'Crucial', NULL),
  ('storage', 'Samsung 980 PRO 1TB NVMe SSD',                    12000, 'Samsung', NULL),
  ('storage', 'Samsung 870 QVO 2TB SATA SSD',                    14000, 'Samsung', NULL),
  ('storage', 'Western Digital Black SN850 1TB NVMe SSD',        20000, 'WD', NULL),
  ('storage', 'Toshiba X300 4TB HDD',                           15000, 'Toshiba', NULL),

  ('motherboard', 'ASUS TUF Gaming B450-PLUS',                   15000, 'ASUS', 'Socket AM4'),
  ('motherboard', 'Gigabyte AORUS B550 Elite',                  25000, 'Gigabyte', 'Socket AM4'),
  ('motherboard', 'Gigabyte Z490 AORUS Elite AC',               27000, 'Gigabyte', 'LGA 1200'),
  ('motherboard', 'MSI MAG B660M Mortar WiFi DDR4',             20000, 'MSI', 'LGA 1700'),
  ('motherboard', 'ASRock Z590 Steel Legend',                   28000, 'ASRock', 'LGA 1200'),
  ('motherboard', 'MSI MAG Z690 TOMAHAWK',                      35000, 'MSI', 'LGA 1700'),
  ('motherboard', 'ASUS ROG Z790 Hero',                         50000, 'ASUS', 'LGA 1700'),
  ('motherboard', 'MSI MPG B550 Gaming Edge WiFi',              28000, 'MSI', 'Socket AM4'),
  ('motherboard', 'ASUS ROG Crosshair X670E Hero',              50000, 'ASUS', 'Socket AM5');

-- Вставка сборок (аналог товаров из изображения)
INSERT INTO Builds (name, image_url, total_price) VALUES
('Бюджетный гейминг', 'budget_gaming.jpg', 86500),
('Средний гейминг', 'mid_gaming.jpg', 144500),
('Топовый гейминг', 'top_gaming.jpg', 205500),
('AM5 гейминг', 'am5_gaming.jpg', 220500),
('Рабочая станция', 'workstation.jpg', 224000),
('AM4 классика', 'am4_classic.jpg', 314000);

-- Связи компонентов со сборками
INSERT INTO Build_Components (build_id, component_id) VALUES
-- Бюджетный гейминг
(1, 1), (1, 10), (1, 19), (1, 28), (1, 37), (1, 46), (1, 55), (1, 64),

-- Средний гейминг
(2, 2), (2, 11), (2, 20), (2, 29), (2, 38), (2, 47), (2, 56), (2, 65),

-- Топовый гейминг
(3, 3), (3, 12), (3, 21), (3, 30), (3, 39), (3, 48), (3, 57), (3, 66),

-- AM5 гейминг
(4, 4), (4, 13), (4, 22), (4, 31), (4, 40), (4, 49), (4, 58), (4, 67),

-- Рабочая станция
(5, 5), (5, 14), (5, 23), (5, 32), (5, 41), (5, 50), (5, 59), (5, 68),

-- AM4 классика
(6, 6), (6, 15), (6, 24), (6, 33), (6, 42), (6, 51), (6, 60), (6, 69);

ALTER TABLE Builds ADD COLUMN is_predefined BOOLEAN DEFAULT FALSE;

-- Помечаем предопределенные сборки
UPDATE Builds SET is_predefined = true;