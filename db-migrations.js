
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
                   `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
});

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

  
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS Components (
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
      
      CREATE TABLE IF NOT EXISTS Builds (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          image_url VARCHAR(255) NOT NULL DEFAULT 'default_build.jpg',
          total_price DECIMAL(10, 2) NOT NULL,
          is_predefined BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS Build_Components (
          build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
          component_id INT NOT NULL REFERENCES Components(id) ON DELETE CASCADE,
          PRIMARY KEY (build_id, component_id)
      );
      
      CREATE TABLE IF NOT EXISTS Cart (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
          quantity INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
          UNIQUE (user_id, build_id)
      );
      
      CREATE TABLE IF NOT EXISTS Favorite (
          user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, build_id)
      );
      
      CREATE TABLE IF NOT EXISTS Orders (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          phone VARCHAR(20) NOT NULL,
          total DECIMAL(10, 2) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS Order_Builds (
          order_id INT NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
          build_id INT NOT NULL REFERENCES Builds(id) ON DELETE CASCADE,
          quantity INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
          unit_price DECIMAL(10, 2) NOT NULL,
          PRIMARY KEY (order_id, build_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_build_components_build ON Build_Components(build_id);
      CREATE INDEX IF NOT EXISTS idx_build_components_component ON Build_Components(component_id);
      CREATE INDEX IF NOT EXISTS idx_cart_user ON Cart(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorite_user ON Favorite(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_user ON Orders(user_id);
    `);

    await client.query(`
      INSERT INTO Components (id, category, name, price, brand, socket) VALUES
        (1, 'processor', 'Intel Core i3-13100 [до 4.4GHz, 4 ядра]',       15000, 'Intel', 'LGA 1700'),
        (2, 'processor', 'AMD Ryzen 5 7600X [до 5.3GHz, 6 ядер]',         40000, 'AMD',   'Socket AM5'),
        (3, 'processor', 'Intel Core i5-13600K [до 5.1GHz, 14 потоков]',   50000, 'Intel', 'LGA 1700'),
        (4, 'processor', 'Intel Core i7-13700K [до 5.4GHz, 16 потоков]',   70000, 'Intel', 'LGA 1700'),
        (5, 'processor', 'AMD Ryzen 7 7800X3D [до 5.0GHz, 8 ядер]',       55000, 'AMD',   'Socket AM5'),
        (6, 'processor', 'Intel Core i9-13900K [до 5.8GHz, 24 потока]',   90000, 'Intel', 'LGA 1700'),
        (7, 'processor', 'AMD Ryzen 9 5900X [до 4.8GHz, 12 ядер]',        75000, 'AMD',   'Socket AM4'),
        (8, 'processor', 'AMD Ryzen 9 7950X3D [до 5.7GHz, 16 ядер]',      80000, 'AMD',   'Socket AM5'),
        (9, 'processor', 'AMD Ryzen 9 9950Х [до 5.7GHz, 16 ядер]',       100000, 'AMD',   'Socket AM5'),
        (10, 'video_card', 'GIGABYTE GeForce GTX 1660 SUPER',               25000, 'GIGABYTE', NULL),
        (11, 'video_card', 'MSI GeForce RTX 3050 VENTUS 2X',                35000, 'MSI', NULL),
        (12, 'video_card', 'MSI GeForce RTX 4060 Ti TUF GAMING',            70000, 'MSI', NULL),
        (13, 'video_card', 'ASUS GeForce RTX 4060 Ti TUF GAMING',           70000, 'ASUS', NULL),
        (14, 'video_card', 'ZOTAC GeForce RTX 3060 Twin Edge OC',           55000, 'ZOTAC', NULL),
        (15, 'video_card', 'MSI GeForce RTX 3070 SUPRIM X',                 95000, 'MSI', NULL),
        (16, 'video_card', 'EVGA GeForce RTX 3070 XC3 Ultra Gaming',        80000, 'EVGA', NULL),
        (17, 'video_card', 'MSI GeForce RTX 4080 SUPER GAMING SLIM WHITE', 120000, 'MSI', NULL),
        (18, 'video_card', 'MSI GeForce RTX 4090 SUPRIM',                  250000, 'MSI', NULL),
        (19, 'memory', '8GB HyperX Fury DDR4',                              6000, 'HyperX', NULL),
        (20, 'memory', '16GB Corsair Vengeance LPX DDR4',                  10000, 'Corsair', NULL),
        (21, 'memory', '16GB Corsair Vengeance RGB Pro DDR4',              12000, 'Corsair', NULL),
        (22, 'memory', '32GB Kingston Fury Beast RGB',                     20000, 'Kingston', NULL),
        (23, 'memory', '32GB G.Skill Trident Z Royal DDR4',                25000, 'G.Skill', NULL),
        (24, 'memory', '32GB TEAMGROUP T-Force Delta RGB White',           30000, 'TEAMGROUP', NULL),
        (25, 'memory', '64GB Crucial Ballistix RGB DDR4',                  35000, 'Crucial', NULL),
        (26, 'memory', '64GB Corsair Vengeance LPX DDR4',                  32000, 'Corsair', NULL),
        (27, 'memory', '64GB G.Skill Ripjaws V DDR5',                      45000, 'G.Skill', NULL),
        (28, 'case', 'Cooler Master MasterBox Q300L',                       8000, 'Cooler Master', NULL),
        (29, 'case', 'Phanteks Eclipse P400A',                             12000, 'Phanteks', NULL),
        (30, 'case', 'NZXT H7 Elite',                                      15000, 'NZXT', NULL),
        (31, 'case', 'Be Quiet! Pure Base 500DX',                          14000, 'Be Quiet!', NULL),
        (32, 'case', 'Lian Li PC-O11 Dynamic',                             19000, 'Lian Li', NULL),
        (33, 'case', 'Corsair 5000D AIRFLOW',                              18000, 'Corsair', NULL),
        (34, 'case', 'Fractal Design Meshify 2',                           22000, 'Fractal Design', NULL),
        (35, 'case', 'Thermaltake H200 TG',                                11000, 'Thermaltake', NULL),
        (36, 'case', 'Cooler Master HAF 700',                              25000, 'Cooler Master', NULL),
        (37, 'power_supply', 'Cooler Master MWE Gold 650W',                 7500, 'Cooler Master', NULL),
        (38, 'power_supply', 'XPG Core Reactor 750W',                       9500, 'XPG', NULL),
        (39, 'power_supply', 'Corsair RM750x',                              8500, 'Corsair', NULL),
        (40, 'power_supply', 'SilverStone Strider 750W',                    8500, 'SilverStone', NULL),
        (41, 'power_supply', 'EVGA SuperNOVA 750 G5',                      10000, 'EVGA', NULL),
        (42, 'power_supply', 'Thermaltake Toughpower GF1 850W',            12000, 'Thermaltake', NULL),
        (43, 'power_supply', 'Corsair RM1000x',                            12000, 'Corsair', NULL),
        (44, 'power_supply', 'Seasonic PRIME TX-850',                      14000, 'Seasonic', NULL),
        (45, 'power_supply', 'be quiet! Dark Power Pro 12 850W',           18000, 'be quiet!', NULL),
        (46, 'cooling', 'be quiet! Pure Rock 2',                            5000, 'be quiet!', NULL),
        (47, 'cooling', 'Arctic Freezer 34 eSports',                        6000, 'Arctic', NULL),
        (48, 'cooling', 'Cooler Master Hyper 212 Black Edition',            4000, 'Cooler Master', NULL),
        (49, 'cooling', 'NZXT Kraken X53',                                 15000, 'NZXT', NULL),
        (50, 'cooling', 'be quiet! Dark Rock Pro 4',                        9000, 'be quiet!', NULL),
        (51, 'cooling', 'Cooler Master MasterLiquid ML360R',               15000, 'Cooler Master', NULL),
        (52, 'cooling', 'Noctua NH-D15',                                  20000, 'Noctua', NULL),
        (53, 'cooling', 'Corsair iCUE H150i ELITE CAPELLIX',               20000, 'Corsair', NULL),
        (54, 'cooling', 'NZXT Kraken Z73',                                 25000, 'NZXT', NULL),
        (55, 'storage', 'Seagate BarraCuda 2TB HDD',                       5000, 'Seagate', NULL),
        (56, 'storage', 'ADATA XPG SX8200 Pro 512GB SSD',                  7000, 'ADATA', NULL),
        (57, 'storage', 'Western Digital Blue 500GB SSD',                  6000, 'WD', NULL),
        (58, 'storage', 'Kingston NV2 1TB NVMe SSD',                       8000, 'Kingston', NULL),
        (59, 'storage', 'Crucial P3 1TB NVMe SSD',                         9000, 'Crucial', NULL),
        (60, 'storage', 'Samsung 980 PRO 1TB NVMe SSD',                    12000, 'Samsung', NULL),
        (61, 'storage', 'Samsung 870 QVO 2TB SATA SSD',                    14000, 'Samsung', NULL),
        (62, 'storage', 'Western Digital Black SN850 1TB NVMe SSD',        20000, 'WD', NULL),
        (63, 'storage', 'Toshiba X300 4TB HDD',                           15000, 'Toshiba', NULL),
        (64, 'motherboard', 'ASUS TUF Gaming B450-PLUS',                   15000, 'ASUS', 'Socket AM4'),
        (65, 'motherboard', 'Gigabyte AORUS B550 Elite',                  25000, 'Gigabyte', 'Socket AM4'),
        (66, 'motherboard', 'Gigabyte Z490 AORUS Elite AC',               27000, 'Gigabyte', 'LGA 1200'),
        (67, 'motherboard', 'MSI MAG B660M Mortar WiFi DDR4',             20000, 'MSI', 'LGA 1700'),
        (68, 'motherboard', 'ASRock Z590 Steel Legend',                   28000, 'ASRock', 'LGA 1200'),
        (69, 'motherboard', 'MSI MAG Z690 TOMAHAWK',                      35000, 'MSI', 'LGA 1700'),
        (70, 'motherboard', 'ASUS ROG Z790 Hero',                         50000, 'ASUS', 'LGA 1700'),
        (71, 'motherboard', 'MSI MPG B550 Gaming Edge WiFi',              28000, 'MSI', 'Socket AM4'),
        (72, 'motherboard', 'ASUS ROG Crosshair X670E Hero',              50000, 'ASUS', 'Socket AM5')
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        socket = EXCLUDED.socket,
        brand = EXCLUDED.brand;
    `);

    await client.query(`
      INSERT INTO Builds (id, name, image_url, total_price, is_predefined) VALUES
        (1, 'Бюджетный гейминг', 'budget_gaming.jpg', 86500, true),
        (2, 'Средний гейминг', 'mid_gaming.jpg', 144500, true),
        (3, 'Топовый гейминг', 'top_gaming.jpg', 205500, true),
        (4, 'AM5 гейминг', 'am5_gaming.jpg', 220500, true),
        (5, 'Рабочая станция', 'workstation.jpg', 224000, true),
        (6, 'AM4 классика', 'am4_classic.jpg', 314000, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        image_url = EXCLUDED.image_url,
        total_price = EXCLUDED.total_price,
        is_predefined = EXCLUDED.is_predefined;
    `);
 
    await client.query(`
      DELETE FROM Build_Components 
      WHERE build_id IN (1, 2, 3, 4, 5, 6);
    `);

    await client.query(`
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
    `);

    await client.query('COMMIT');
    console.log('Миграции успешно выполнены');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка выполнения миграций:', error);
    throw error;
  } finally {
    client.release();
  }
};

runMigrations()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Ошибка при выполнении миграций:', err);
    process.exit(1);
  });