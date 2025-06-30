// import pg from 'pg';
// import dotenv from 'dotenv';


// dotenv.config();

// const { Pool } = pg;

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// export default pool;

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

export default pool;
