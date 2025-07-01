import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
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
      console.error(`Запрос с этого домена запрещен: ${origin}`);
      callback(new Error('Доступ запрещен политикой CORS'));
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
  res.send('API конфигуратора ПК работает!');
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
    console.log(`Получение компонентов для сборки ID: ${buildId}`);
    const { rows } = await pool.query(
      `SELECT c.* 
       FROM build_components bc
       JOIN components c ON bc.component_id = c.id
       WHERE bc.build_id = $1`,
      [buildId]
    );
    console.log(`Найдено ${rows.length} компонентов для сборки ${buildId}`);
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения компонентов сборки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Роут для синхронизации корзины
app.post('/api/basket/sync', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { items } = req.body;

    // Начало транзакции
    await pool.query('BEGIN');

    // Очищаем текущую корзину пользователя
    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    for (const item of items) {
      await pool.query(
        `INSERT INTO cart (user_id, build_id, quantity)
         VALUES ($1, $2, $3)`,
        [userId, item.build_id, item.quantity]
      );
    }

    await pool.query('COMMIT');

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
    await pool.query('ROLLBACK');
    console.error('Ошибка синхронизации корзины:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Срок действия токена истек' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Неверный токен' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера: ' + error.message });
  }
});

app.use((err, req, res, next) => {
  console.error('Глобальный обработчик ошибок:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Неверный токен авторизации' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Ошибка валидации данных',
      errors: err.errors 
    });
  }

  if (err.code === '23505') { 
    const field = err.constraint.split('_')[1];
    return res.status(409).json({ 
      message: 'Дублирующая запись',
      field: field === 'email' ? 'email' : field
    });
  }
  
  const statusCode = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  
  res.status(statusCode).json({ 
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      fullError: JSON.stringify(err)
    })
  });
});

app.get('*', (req, res) => {
  res.status(404).json({ message: 'Ресурс не найден' });
});

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ База данных подключена');
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();