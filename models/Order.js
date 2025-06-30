import pool from '../db.js';

export default class Order {
  static async create({ user_id, phone, total, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      

      const { rows: [order] } = await client.query(
        `INSERT INTO Orders (user_id, phone, total)
         VALUES ($1, $2, $3) RETURNING *`,
        [user_id, phone, total]
      );
      
      for (const item of items) {
        await client.query(
          `INSERT INTO Order_Builds (order_id, build_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.build_id, item.quantity, item.unit_price]
        );
      }
      
      await client.query('COMMIT');
      return { ...order, items }; 
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getByUser(user_id) {
    const { rows } = await pool.query(
      `SELECT 
          o.id,
          o.created_at,
          o.phone,
          o.total,
          json_agg(json_build_object(
            'build_id', ob.build_id,
            'name', b.name,
            'image_url', b.image_url,
            'quantity', ob.quantity,
            'unit_price', ob.unit_price
          )) AS items
       FROM Orders o
       JOIN Order_Builds ob ON o.id = ob.order_id
       JOIN Builds b ON ob.build_id = b.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [user_id]
    );
    return rows;
  }

  static async getAll() {
    const { rows } = await pool.query(
      `SELECT 
          o.id,
          o.created_at,
          o.phone,
          o.total,
          u.email AS user_email,
          json_agg(json_build_object(
            'build_id', ob.build_id,
            'name', b.name,
            'quantity', ob.quantity,
            'unit_price', ob.unit_price
          )) AS items
       FROM Orders o
       JOIN Order_Builds ob ON o.id = ob.order_id
       JOIN Builds b ON ob.build_id = b.id
       JOIN Users u ON o.user_id = u.id
       GROUP BY o.id, u.email
       ORDER BY o.created_at DESC`
    );
    return rows;
  }

  static async getById(order_id) {
    const { rows } = await pool.query(
      `SELECT 
          o.id,
          o.created_at,
          o.phone,
          o.total,
          u.email AS user_email,
          json_agg(json_build_object(
            'build_id', ob.build_id,
            'name', b.name,
            'image_url', b.image_url,
            'quantity', ob.quantity,
            'unit_price', ob.unit_price
          )) AS items
       FROM Orders o
       JOIN Order_Builds ob ON o.id = ob.order_id
       JOIN Builds b ON ob.build_id = b.id
       JOIN Users u ON o.user_id = u.id
       WHERE o.id = $1
       GROUP BY o.id, u.email`,
      [order_id]
    );
    return rows[0] || null;
  }
}