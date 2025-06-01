import express from 'express';
import cors from 'cors';
import { config } from './config.js'; // ← importante el ".js"


const app = express();
app.use(cors());
app.use(express.json());

// Setear el puerto
app.set('port', config.app.port);

//Importar controlador de prueba
import testRoutes from './rutas/rutaTest.js';

// Importar controlador de rutas
import reporteGeneral from './rutas/rutasReporte.js'; // ← asegúrate de usar .js

//Ruta de prueba
app.use('/api/testRoutes', testRoutes);

// Ruta del reporte
app.use('/api/reporteGeneral', reporteGeneral);

app.get('/', (req, res) => {
    res.send('LA PERRA HIJUEPUTA API FUNCIONA CORRECTAMENTE 🚀💋')
})

export default app;
