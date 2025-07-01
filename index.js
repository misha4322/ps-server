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
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'https://ps-client.vercel.app',
  'https://ps-client-git-main-misha4322s-projects.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.send('PC Configurator API is running!');
});

app.use('/api/auth', authRouter);
app.use('/api/builds', buildRouter);
app.use('/api/basket', basketRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/orders', orderRouter);
app.use('/api/components', productRouter);

app.get('/api/builds/:id/components', async (req, res) => {
  try {
    const buildId = parseInt(req.params.id);
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

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: err.message || 'Internal server error'
  });
});

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();