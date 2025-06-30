import Favorite from '../models/Favorite.js';
import pool from '../db.js';

export const addFavorite = async (req, res) => {
  const user_id = req.user.userId;
  const { build_id } = req.body;

  try {
    const favorite = await Favorite.addFavorite(user_id, build_id);
    const { rows } = await pool.query(
      `SELECT b.*, 
              json_agg(json_build_object(
                'id', c.id,
                'name', c.name,
                'price', c.price,
                'category', c.category
              )) AS components
       FROM builds b
       LEFT JOIN build_components bc ON b.id = bc.build_id
       LEFT JOIN components c ON bc.component_id = c.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [build_id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const getFavorites = async (req, res) => {
  const user_id = req.user.userId;

  try {
    const favorites = await Favorite.getFavorites(user_id);
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const removeFavorite = async (req, res) => {
  const user_id = req.user.userId;
  const build_id = req.params.id;

  try {
    await Favorite.removeFavorite(user_id, build_id);
    res.status(200).json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};