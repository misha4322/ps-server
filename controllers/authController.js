import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';

export const register = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
    }
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }
    
    const newUser = await User.create({ email, password });
    
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    });
    
    res.status(201).json({ 
      token, 
      user: { id: newUser.id, email: newUser.email } 
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      id: user.id, 
      email: user.email 
    });
  } catch (error) {
    console.error("Auth check error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Не авторизован' });
  }
  
  const { currentPassword, newPassword } = req.body;
  const user_id = req.user.userId;

  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Текущий пароль неверен' });
    }
    
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: 'Новый пароль должен отличаться от текущего' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [password_hash, user_id]);

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    res.json({ token: newToken });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};