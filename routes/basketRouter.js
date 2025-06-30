// server/routes/basketRouter.js
import express from 'express';
import Basket from '../models/Basket.js';
import auth from '../middleware/auth.js';
import { syncBasket, getBasket } from '../controllers/basketController.js';

const router = express.Router();
router.use(auth);

router.get('/', getBasket);
router.post('/sync', syncBasket);

// Получение корзины пользователя
router.get('/', auth, async (req, res) => {
  try {
    const basket = await Basket.getByUser(req.user.userId);
    res.json(basket);
  } catch (error) {
    console.error('Get basket error:', error);
    res.status(500).json({ message: 'Ошибка при получении корзины' });
  }
});

router.post('/sync', auth, async (req, res) => {
  const user_id = req.user.userId;
  const { items } = req.body;

  try {
    const basket = await Basket.sync(user_id, items);
    res.json(basket);
  } catch (error) {
    console.error('Basket sync error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    const item = await Basket.add(req.user.userId, req.body.build_id, req.body.quantity);
    res.json(item);
  } catch (error) {
    console.error('Add to basket error:', error);
    res.status(500).json({ message: 'Ошибка при добавлении в корзину' });
  }
});


router.delete('/:id', auth, async (req, res) => {
  try {
    await Basket.remove(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove from basket error:', error);
    res.status(500).json({ message: 'Ошибка при удалении из корзины' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Basket.updateQuantity(req.params.id, req.body.quantity);
    res.json(item);
  } catch (error) {
    console.error('Update basket quantity error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении количества' });
  }
});

export default router;