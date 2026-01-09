// src/lib/export-attendance-pdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AsistenciaResumenDiario } from './types';
import { formatMinutos } from './date';

export function exportAttendancePdf(params: {
    usuarioNombre: string;
    rows: AsistenciaResumenDiario[];
    fileName?: string;
}) {
    const { usuarioNombre, rows, fileName } = params;

    const doc = new jsPDF('p', 'mm', 'a4');

    // Título
    doc.setFontSize(14);
    doc.text('Reporte de Asistencia', 14, 16);

    doc.setFontSize(10);
    doc.text(`Usuario: ${usuarioNombre}`, 14, 24);
    doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, 14, 30);

    autoTable(doc, {
        startY: 36,
        head: [['Fecha', 'Entrada', 'Salida', 'Total', 'Estado']],
        body: rows.map((r) => [
            r.fecha,
            r.horaEntrada ?? '',
            r.horaSalida ?? '',
            formatMinutos(r.minutosTrabajados ?? 0),
            r.estado,
        ]),
        styles: {
            fontSize: 9,
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: 20,
        },
        columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 28 },
            2: { cellWidth: 28 },
            3: { cellWidth: 28 },
        },
    });

    const safeName =
        fileName ??
        `asistencia-${usuarioNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;

    doc.save(safeName);
}