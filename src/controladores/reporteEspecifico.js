import db from '../BD/connection.js';
import puppeteer from 'puppeteer';

const generarPDFArbolesPorRegion = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.Nombre AS Region, a.Id, a.NombreComun, a.Condicion, a.Azimut, a.Distancia,
                a.Numero_fustes, a.Diametro, a.Altura_fuste, a.Forma_fuste, a.Altura_total,
                a.Diametro_fuste, a.Diametro_copa, 
                e.NombreCientifico AS Especie, 
                t.Descripcion AS Tamano 
            FROM Arbol a 
            JOIN Especie e ON a.IdEspecie = e.Id 
            JOIN Tamano t ON a.IdTamano = t.Id 
            JOIN Sub_parcela sp ON a.IdSubparcela = sp.Id 
            JOIN Conglomerado c ON sp.IdConglomerado = c.Id 
            JOIN Region r ON c.IdRegion = r.Id 
            ORDER BY r.Nombre, a.Id;
        `;
        
        const result = await db.query(query);

        // Agrupar por región
        const regiones = {};
        for (const row of result) {
            const region = row.region;
            if (!regiones[region]) regiones[region] = [];
            regiones[region].push(row);
        }

        const html = generarHTMLPorRegion(regiones);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="reporte_arboles_por_region.pdf"',
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ error: 'Error al generar el PDF' });
    }
};

function generarHTMLPorRegion(regiones) {
    let html = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            h2 { margin-top: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 11px; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Reporte de Árboles por Región</h1>
    `;

    for (const [region, arboles] of Object.entries(regiones)) {
        html += `
        <h2>Región: ${region}</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre común</th>
                    <th>Condición</th>
                    <th>Especie</th>
                    <th>Tamaño</th>
                    <th>Azimut</th>
                    <th>Distancia</th>
                    <th>Nº fustes</th>
                    <th>Diámetro</th>
                    <th>Alt. fuste</th>
                    <th>Forma fuste</th>
                    <th>Alt. total</th>
                    <th>Diám. fuste</th>
                    <th>Diám. copa</th>
                </tr>
            </thead>
            <tbody>
        `;

        for (const a of arboles) {
            html += `
                <tr>
                    <td>${a.id}</td>
                    <td>${a.nombrecomun}</td>
                    <td>${a.condicion}</td>
                    <td>${a.especie}</td>
                    <td>${a.tamano}</td>
                    <td>${a.azimut}</td>
                    <td>${a.distancia}</td>
                    <td>${a.numero_fustes}</td>
                    <td>${a.diametro}</td>
                    <td>${a.altura_fuste}</td>
                    <td>${a.forma_fuste}</td>
                    <td>${a.altura_total}</td>
                    <td>${a.diametro_fuste}</td>
                    <td>${a.diametro_copa}</td>
                </tr>
            `;
        }

        html += `</tbody></table>`;
    }

    html += `</body></html>`;
    return html;
}


const generarPDFSuelos = async (req, res) => {
    try {
        const query = `
            SELECT s.id, s.carbono, s.color, s.fertilidad, r.nombre AS region
            FROM suelo s
            JOIN sub_parcela sp ON s.idsubparcela = sp.id
            JOIN conglomerado c ON sp.idconglomerado = c.id
            JOIN region r ON c.idregion = r.id
            ORDER BY r.nombre, s.id
        `;

        const result = await db.query(query);
        const rows = result.rows || result; // Según tu motor de base de datos

        // Agrupar por región
        const regiones = {};
        for (const row of rows) {
            const region = row.region;
            if (!regiones[region]) {
                regiones[region] = [];
            }
            regiones[region].push({
                Id: row.id,
                Carbono: row.carbono,
                Color: row.color,
                Fertilidad: row.fertilidad
            });
        }

        // Generar HTML para el reporte
        const html = generarHTMLSuelos(regiones);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="reporte_suelos.pdf"',
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar el PDF de suelos' });
    }
};

// Función para construir el HTML
function generarHTMLSuelos(regiones) {
    let html = `
    <html>
        <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .header { margin-top: 40px; margin-bottom: 10px; }
        </style>
        </head>
        <body>
        <h1>Reporte de Suelos por Región</h1>`;

    for (const [region, suelos] of Object.entries(regiones)) {
        html += `
        <div class="header">
            <h2>Región: ${region}</h2>
        </div>
        <table>
            <thead>
            <tr>
                <th>ID</th>
                <th>Carbono</th>
                <th>Color</th>
                <th>Fertilidad</th>
            </tr>
            </thead>
            <tbody>
            ${suelos.map(s => `
                <tr>
                <td>${s.Id}</td>
                <td>${s.Carbono}</td>
                <td>${s.Color}</td>
                <td>${s.Fertilidad}</td>
                </tr>
            `).join('')}
            </tbody>
        </table>`;
    }

    html += `</body></html>`;
    return html;
}


const generarPDFEspecies = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT e.*, r.nombre AS nombre_region
            FROM especie e
            JOIN arbol a ON e.id = a.idespecie
            JOIN sub_parcela sp ON a.idsubparcela = sp.id
            JOIN conglomerado c ON sp.idconglomerado = c.id
            JOIN region r ON c.idregion = r.id
            ORDER BY r.nombre, e.nombrecientifico
        `;

        const result = await db.query(query);
        const rows = result.rows || result;

        // Agrupar especies por región
        const regiones = {};
        for (const row of rows) {
            const region = row.nombre_region;
            if (!regiones[region]) {
                regiones[region] = [];
            }
            regiones[region].push({
                Id: row.id,
                NombreCientifico: row.nombrecientifico,
                Familia: row.familia,

            });
        }

        const html = generarHTMLEspecies(regiones);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="reporte_especies.pdf"',
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar el PDF de especies' });
    }
};

// HTML generator
function generarHTMLEspecies(regiones) {
    let html = `
    <html>
        <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .header { margin-top: 40px; margin-bottom: 10px; }
        </style>
        </head>
        <body>
        <h1>Reporte de Especies por Región</h1>`;

    for (const [region, especies] of Object.entries(regiones)) {
        html += `
        <div class="header">
            <h2>Región: ${region}</h2>
        </div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre Científico</th>
                    <th>Familia</th>
                </tr>
            </thead>
            <tbody>
                ${especies.map(e => `
                    <tr>
                        <td>${e.Id}</td>
                        <td>${e.NombreCientifico}</td>
                        <td>${e.Familia}</td>

                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    html += `</body></html>`;
    return html;
}
export default { generarPDFArbolesPorRegion, generarPDFSuelos, generarPDFEspecies };