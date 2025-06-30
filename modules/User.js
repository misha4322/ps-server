// server/modules/User.js
import pool from '../db.js';

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

  static async create({ email, password_hash }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2) RETURNING *`,
      [email, password_hash]
    );
    return rows[0];
  }
}