import pool from '../db.js';

export default class Favorite {
  static async getFavorites(user_id) {
    const { rows } = await pool.query(
      `SELECT b.*, 
              json_agg(json_build_object(
                'id', c.id,
                'name', c.name,
                'price', c.price,
                'category', c.category
              )) AS components
       FROM favorite f
       JOIN builds b ON f.build_id = b.id
       LEFT JOIN build_components bc ON b.id = bc.build_id
       LEFT JOIN components c ON bc.component_id = c.id
       WHERE f.user_id = $1
       GROUP BY b.id`,
      [user_id]
    );
    return rows;
  }

  static async addFavorite(user_id, build_id) {
    const { rows } = await pool.query(
      `INSERT INTO favorite (user_id, build_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, build_id) DO NOTHING
       RETURNING *`,
      [user_id, build_id]
    );
    return rows[0] || { user_id, build_id };
  }

  static async removeFavorite(user_id, build_id) {
    const { rowCount } = await pool.query(
      `DELETE FROM favorite WHERE user_id = $1 AND build_id = $2`,
      [user_id, build_id]
    );
    return rowCount > 0;
  }
}