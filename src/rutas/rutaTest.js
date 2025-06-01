import express from 'express';
const router = express.Router();
import db from '../BD/connection.js'

router.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT 1 + 1 AS solution'); // ✔️ Usa pool.query
        res.json({ conectado: true, solution: result[0].solution });
    } catch (err) {
        console.error("Error de BD:", err);
        res.status(500).json({ conectado: false, error: err.message });
    }
});
console.log(typeof db.query); // Debería ser "object"
console.log(db.query); // Debería mostrar [Function: query]

export default router;