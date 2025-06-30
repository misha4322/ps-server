import express from 'express';
import { register, login, checkAuth, refreshToken } from '../controllers/authController.js'; 
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/check', checkAuth);
router.post('/refresh', refreshToken); 

export default router;