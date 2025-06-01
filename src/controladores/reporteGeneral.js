import db from '../BD/connection.js';
import puppeteer from 'puppeteer';

const generarPDFConglomerados = async (req, res) => {
    const { ids } = req.body; // Array de IDs: [1, 3, 5]

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Debes proporcionar IDs de conglomerados' });
    }

    try {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        const query = `
        SELECT c.Id, c.Latitud, c.Longitud, c.PostEstrato, TO_CHAR(c.FechaInicial, 'DD/MM/YYYY') AS FechaInicial, TO_CHAR(c.FechaFinal, 'DD/MM/YYYY') AS FechaFinal, r.nombre AS Region,
            a.NombreComun, a.Condicion,
            e.NombreCientifico AS Especie,
            s.carbono, s.fertilidad
        FROM Arbol a
        JOIN Especie e ON a.IdEspecie = e.Id
        JOIN Sub_parcela sp ON a.IdSubParcela = sp.Id
        JOIN Conglomerado c ON sp.IdConglomerado = c.Id
        JOIN Region r ON c.IdRegion = r.Id
        JOIN suelo s ON sp.Id = s.IdSubParcela
        WHERE c.Id IN (${placeholders});
    `;
        const rows = await db.query(query, ids);
        console.log('Resultado de la consulta:', rows);

        // Agrupar por conglomerado
        const conglomerados = {};
        for (const row of rows) {
            if (!conglomerados[row.id]) {
                conglomerados[row.id] = {
                    info: {
                        id: row.id,
                        Latitud: row.latitud,
                        Longitud: row.longitud,
                        FechaInicial: row.fechainicial,
                        FechaFinal: row.fechafinal,
                        Region: row.region
                    },
                    arboles: []
                };
            }
            conglomerados[row.id].arboles.push({
                NombreComun: row.nombrecomun,
                Condicion: row.condicion,
                Especie: row.especie,
                Carbono: row.carbono,
                Fertilidad: row.fertilidad
            });
        }

        // Generar HTML para el reporte
        const html = generarHTMLReporte(conglomerados);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="reporte_conglomerados.pdf"',
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar el PDF' });
    }
};

// HTML generator helper
function generarHTMLReporte(conglomerados) {
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
        <h1>Reporte de Conglomerados</h1>`;

    for (const [id, { info, arboles }] of Object.entries(conglomerados)) {
        html += `
        <div class="header">
            <h2>Conglomerado #${info.id}</h2>
            <p><strong>Región:</strong> ${info.Region}</p>
            <p><strong>Ubicación:</strong> ${info.Latitud}, ${info.Longitud}</p>
            <p><strong>Fechas:</strong> ${info.FechaInicial} – ${info.FechaFinal}</p>
        </div>
        <table>
            <thead>
            <tr>
                <th>Nombre común</th>
                <th>Condición</th>
                <th>Especie</th>
                <th>Carbono</th>
                <th>Fertilidad</th>
            </tr>
            </thead>
            <tbody>
            ${arboles.map(a => `
                <tr>
                <td>${a.NombreComun}</td>
                <td>${a.Condicion}</td>
                <td>${a.Especie}</td>
                <td>${a.Carbono}</td>
                <td>${a.Fertilidad}</td>
                </tr>
            `).join('')}
            </tbody>
        </table>`;
    }

    html += `</body></html>`;
    return html;
}

export default { generarPDFConglomerados };
