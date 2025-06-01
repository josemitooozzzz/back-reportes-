import express from 'express';
import ReportesController from '../controladores/reporteGeneral.js';
import reporteEspecificos from "../controladores/reporteEspecifico.js"

const router = express.Router();

router.post('/pdf/conglomerados', ReportesController.generarPDFConglomerados);
router.get('/pdf/arboles', reporteEspecificos.generarPDFArbolesPorRegion)
router.get('/pdf/suelo', reporteEspecificos.generarPDFSuelos)
router.get('/pdf/especie', reporteEspecificos.generarPDFEspecies)
export default router;