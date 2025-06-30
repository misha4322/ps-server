
import pool from '../db.js';

export default class Basket {
  static async add(user_id, build_id, quantity = 1) {
    const { rows } = await pool.query(
      `INSERT INTO Cart (user_id, build_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, build_id)
       DO UPDATE SET quantity = Cart.quantity + EXCLUDED.quantity
       RETURNING *`,
      [user_id, build_id, quantity]
    );
    return rows[0];
  }

  static async getByUser(user_id) {
    const { rows } = await pool.query(
      `SELECT c.*, b.name, b.image_url, b.total_price
       FROM Cart c
       JOIN Builds b ON c.build_id = b.id
       WHERE c.user_id = $1`,
      [user_id]
    );
    return rows;
  }

  static async remove(id) {
    await pool.query('DELETE FROM Cart WHERE id = $1', [id]);
  }

  static async updateQuantity(id, quantity) {
    const { rows } = await pool.query(
      'UPDATE Cart SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    return rows[0];
  }

  static async sync(user_id, items) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM Cart WHERE user_id = $1', [user_id]);
      // Добавляем новые элементы
      for (const item of items) {
        await client.query(
          `INSERT INTO Cart (user_id, build_id, quantity)
           VALUES ($1, $2, $3)`,
          [user_id, item.build_id, item.quantity]
        );
      }
      await client.query('COMMIT');
      const { rows } = await client.query(
        `SELECT c.*, b.name, b.image_url, b.total_price
         FROM Cart c
         JOIN Builds b ON c.build_id = b.id
         WHERE c.user_id = $1`,
        [user_id]
      );
      return rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}