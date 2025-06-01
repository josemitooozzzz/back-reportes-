import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config() // Cargar variables de entorno del .env

// Crea el pool de conexiones
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Necesario para conexiones a Neon u otros servicios que requieren SSL
    },
});

// Exporta una función genérica para hacer queries
const query = async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows;
};

export default { query };
