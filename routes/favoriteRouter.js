import express from 'express';
import { addFavorite, getFavorites, removeFavorite } from '../controllers/favoriteController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

router.post('/', addFavorite);
router.get('/', getFavorites);
router.delete('/:id', removeFavorite);

export default router;