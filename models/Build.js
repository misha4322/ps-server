import  pool  from '../db.js';

export default class Build {
  static async create({ name, total_price }) {
    const { rows } = await pool.query(
      `INSERT INTO builds (name, total_price, image_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, total_price, 'default_build.jpg']
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM builds WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async addComponents(build_id, components) {
    await Promise.all(
      components.map(component_id => 
        pool.query(
          `INSERT INTO build_components (build_id, component_id)
           VALUES ($1, $2)`,
          [build_id, component_id]
        )
      )
    );
  }

  static async getComponents(build_id) {
    const { rows } = await pool.query(
      `SELECT c.* 
       FROM build_components bc
       JOIN components c ON bc.component_id = c.id
       WHERE bc.build_id = $1`,
      [build_id]
    );
    return rows;
  }
}