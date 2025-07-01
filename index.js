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

app.use(cors({
  origin: ['https://ps-client-misha4322s-projects.vercel.app', 'https://ps-client.vercel.app/' ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 
   allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  next();
});
app.use(express.json());
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Не удалось запустить миграции:', err);
  });

 startServer();