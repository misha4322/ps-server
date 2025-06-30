import express from 'express';
import { 
  createOrder, 
  getUserOrders,
  completeOrder 
} from '../controllers/orderController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.put('/:id/complete', completeOrder);

export default router;