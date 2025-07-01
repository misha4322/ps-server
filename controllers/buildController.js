import pool from '../db.js';

export const getBuilds = async (req, res) => {
  try {
    const predefinedOnly = req.query.predefined === 'true';
    
    let query = `
      SELECT b.*, 
             json_agg(json_build_object(
               'id', c.id,
               'name', c.name,
               'price', c.price,
               'category', c.category
             )) AS components
      FROM builds b
      LEFT JOIN build_components bc ON b.id = bc.build_id
      LEFT JOIN components c ON bc.component_id = c.id
    `;
    
    if (predefinedOnly) {
      query += ' WHERE b.is_predefined = true ';
    }
    
    query += ' GROUP BY b.id ';
    
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error getting builds:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBuild = async (req, res) => {
  const { name, total_price, components, is_predefined = false } = req.body;
  
  try {
    const { rows: [build] } = await pool.query(
      `INSERT INTO builds (name, total_price, image_url, is_predefined)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, total_price, 'default_build.jpg', is_predefined]
    );
    
    await Promise.all(
      components.map(component_id => 
        pool.query(
          `INSERT INTO build_components (build_id, component_id)
           VALUES ($1, $2)`,
          [build.id, component_id]
        )
      )
    );
    
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
      [build.id]
    );
    
    console.log('Build created successfully:', fullBuildRes.rows[0]);
    res.status(201).json(fullBuildRes.rows[0]);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};