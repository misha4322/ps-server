import pool from '../db.js';

export const syncBasket = async (req, res) => {
  const user_id = req.user.userId;
  const { items } = req.body;

  try {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM Cart WHERE user_id = $1', [user_id]);
    for (const item of items) {
      await pool.query(
        `INSERT INTO Cart (user_id, build_id, quantity)
         VALUES ($1, $2, $3)`,
        [user_id, item.build_id, item.quantity]
      );
    }
    await pool.query('COMMIT');

    const { rows } = await pool.query(
      `SELECT c.*, b.name, b.image_url, b.total_price
       FROM Cart c
       JOIN Builds b ON c.build_id = b.id
       WHERE c.user_id = $1`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Basket sync error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBasket = async (req, res) => {
  const user_id = req.user.userId;

  try {
    const { rows } = await pool.query(
      `SELECT c.*, b.name, b.image_url, b.total_price
       FROM Cart c
       JOIN Builds b ON c.build_id = b.id
       WHERE c.user_id = $1`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get basket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
