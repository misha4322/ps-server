import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import authRouter from './routes/authRouter.js';
import buildRouter from './routes/buildRouter.js';
import basketRouter from './routes/basketRouter.js';
import favoriteRouter from './routes/favoriteRouter.js';
import orderRouter from './routes/orderRouter.js';
import productRouter from './routes/productRouter.js';
import runMigrations from './db-migrations.js';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Получение текущего пути модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка CORS
const allowedOrigins = [
  'https://ps-client.vercel.app',
  'https://ps-client-git-main-misha4322s-projects.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS not allowed for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Парсинг JSON и URL-encoded данных
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware для логгирования запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Проверочный роут
app.get('/', (req, res) => {
  res.send('PC Configurator API is running!');
});

// Подключение роутеров
app.use('/api/auth', authRouter);
app.use('/api/builds', buildRouter);
app.use('/api/basket', basketRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/orders', orderRouter);
app.use('/api/components', productRouter);

// Роут для получения компонентов сборки
app.get('/api/builds/:id/components', async (req, res) => {
  try {
    const buildId = req.params.id;
    console.log(`Fetching components for build ID: ${buildId}`);
    const { rows } = await pool.query(
      `SELECT c.* 
       FROM build_components bc
       JOIN components c ON bc.component_id = c.id
       WHERE bc.build_id = $1`,
      [buildId]
    );
    console.log(`Found ${rows.length} components for build ${buildId}`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching build components:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Роут для синхронизации корзины (исправленный)
app.post('/api/basket/sync', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { items } = req.body;

    // Начало транзакции
    await pool.query('BEGIN');

    // Очищаем текущую корзину пользователя
    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    // Вставляем новые элементы
    for (const item of items) {
      await pool.query(
        `INSERT INTO cart (user_id, build_id, quantity)
         VALUES ($1, $2, $3)`,
        [userId, item.build_id, item.quantity]
      );
    }

    // Завершаем транзакцию
    await pool.query('COMMIT');

    // Получаем обновленную корзину с названиями и ценами
    const { rows } = await pool.query(
      `SELECT c.id, c.build_id, c.quantity, b.name, b.image_url, b.total_price
       FROM cart c
       JOIN builds b ON c.build_id = b.id
       WHERE c.user_id = $1`,
      [userId]
    );

    res.json(rows.map(row => ({
      id: row.id,
      build_id: row.build_id,
      quantity: row.quantity,
      name: row.name,
      image_url: row.image_url,
      total_price: row.total_price
    })));
  } catch (error) {
    // Откатываем транзакцию при ошибке
    await pool.query('ROLLBACK');
    console.error('Basket sync error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Обработка специфических ошибок
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Ошибки валидации
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: err.errors 
    });
  }
  
  // Ошибки базы данных
  if (err.code === '23505') { // unique_violation
    return res.status(409).json({ 
      message: 'Duplicate entry',
      field: err.constraint.split('_')[1]
    });
  }
  
  // Общая обработка ошибок
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      fullError: JSON.stringify(err)
    })
  });
});

// Обработка 404 для React Router
app.get('*', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Функция запуска сервера
async function startServer() {
  try {
    // Проверка подключения к базе данных
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    // Запуск миграций
    await runMigrations();
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();