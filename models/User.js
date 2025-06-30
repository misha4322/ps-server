import bcrypt from 'bcryptjs';
import  pool  from '../db.js';

export default class User {
  static async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ email, password }) {
    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, password_hash]
    );
    return rows[0];
  }
}