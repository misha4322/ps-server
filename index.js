import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import authRouter from './routes/authRouter.js';
import buildRouter from './routes/buildRouter.js';
import basketRouter from './routes/basketRouter.js';
import favoriteRouter from './routes/favoriteRouter.js';
import orderRouter from './routes/orderRouter.js';
import productRouter from './routes/productRouter.js';
import runMigrations from './db-migrations.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Настройка CORS
const allowedOrigins = [
  'https://ps-client.vercel.app',
  'https://ps-client-git-main-misha4322e-projects.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Middleware для логгирования
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

// Роут для компонентов сборки
app.get('/api/builds/:id/components', async (req, res) => {
  try {
    const buildId = req.params.id;
    const { rows } = await pool.query(
      `SELECT c.* 
       FROM build_components bc
       JOIN components c ON bc.component_id = c.id
       WHERE bc.build_id = $1`,
      [buildId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching build components:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
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
      console.log(`🔗 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Запуск сервера
startServer();