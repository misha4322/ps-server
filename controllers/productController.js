import  pool  from '../db.js';

export const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM components ORDER BY category, name`);
    const grouped = rows.reduce((acc, p) => {
      (acc[p.category] || (acc[p.category] = [])).push(p);
      return acc;
    }, {});
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getById = async (req, res) => {
  const id = +req.params.id;
  try {
    const { rows } = await pool.query(`SELECT * FROM components WHERE id=$1`, [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Товар не найден' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};