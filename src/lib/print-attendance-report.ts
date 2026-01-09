// src/lib/print-attendance-report.ts
import type { AsistenciaResumenDiario } from './types';
import { formatMinutos, isWeekendISO } from './date';

function escapeHtml(s: string) {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function estadoLabel(estado: AsistenciaResumenDiario['estado']) {
    switch (estado) {
        case 'OK':
            return 'OK';
        case 'INCOMPLETO':
            return 'INCOMPLETO';
        case 'SIN_REGISTRO':
            return 'SIN REGISTRO';
        case 'PERMISO':
            return 'PERMISO';
        case 'FDS':
            return 'FDS';
        default:
            return String(estado);
    }
}

function buildHtml(params: {
    usuarioNombre: string;
    rows: AsistenciaResumenDiario[];
    title?: string; // ✅ nuevo
}) {
    const { usuarioNombre, rows, title } = params;

    const hoy = new Date();
    const generado = hoy.toLocaleString('es-BO');

    const fechas = rows.map((r) => r.fecha).sort();
    const desde = fechas[0] ?? '-';
    const hasta = fechas[fechas.length - 1] ?? '-';

    const objetivoTotal = rows.reduce(
        (acc, r) => acc + (typeof r.minutosObjetivo === 'number' ? r.minutosObjetivo : 0),
        0,
    );
    const trabajadoTotal = rows.reduce((acc, r) => acc + (r.minutosTrabajados ?? 0), 0);

    const diasConRegistro = rows.filter((r) => r.estado === 'OK' || r.estado === 'INCOMPLETO').length;
    const diasSinRegistro = rows.filter((r) => r.estado === 'SIN_REGISTRO').length;
    const diasPermiso = rows.filter((r) => r.estado === 'PERMISO').length;
    const diasFds = rows.filter((r) => r.estado === 'FDS' || isWeekendISO(r.fecha)).length;

    const WARN_THRESHOLD_MIN = 15;
    const URGENT_THRESHOLD_MIN = 60;

    const rowsHtml = rows
        .slice()
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .map((r) => {
            const weekend = r.estado === 'FDS' || isWeekendISO(r.fecha);
            const hasRegistro = r.estado === 'OK' || r.estado === 'INCOMPLETO';

            const objetivo = typeof r.minutosObjetivo === 'number' ? r.minutosObjetivo : null;
            const diff = objetivo !== null ? objetivo - (r.minutosTrabajados ?? 0) : 0;

            const aplicaComparacion = !weekend && r.estado !== 'PERMISO' && objetivo !== null && hasRegistro;
            const isUrgent = aplicaComparacion && diff >= URGENT_THRESHOLD_MIN;
            const isWarn = aplicaComparacion && diff >= WARN_THRESHOLD_MIN && diff < URGENT_THRESHOLD_MIN;

            const alertTxt = isUrgent ? '⛔' : isWarn ? '⚠️' : '';
            const faltanteTxt = aplicaComparacion && diff > 0 ? `-${diff}m` : '';

            const estado = estadoLabel(r.estado);

            return `
        <tr class="${weekend ? 'weekend' : ''}">
          <td>
            <div class="dateCell">
              <span class="date">${escapeHtml(r.fecha)}</span>
              ${alertTxt ? `<span class="alertIcon" title="No cumplió objetivo">${alertTxt}</span>` : ''}
              ${
                faltanteTxt
                    ? `<span class="pill ${isUrgent ? 'pill-danger' : 'pill-warn'}">${escapeHtml(faltanteTxt)}</span>`
                    : ''
            }
              ${
                weekend
                    ? `<span class="pill pill-out">FDS</span>`
                    : r.estado === 'PERMISO'
                        ? `<span class="pill pill-warn">PERMISO</span>`
                        : r.estado === 'INCOMPLETO'
                            ? `<span class="pill pill-warn">INCOMPLETO</span>`
                            : r.estado === 'SIN_REGISTRO'
                                ? `<span class="pill pill-out">SIN REGISTRO</span>`
                                : hasRegistro
                                    ? `<span class="pill pill-ok">CON REGISTRO</span>`
                                    : ''
            }
            </div>
          </td>
          <td>${escapeHtml(r.horaEntrada ?? '')}</td>
          <td>${escapeHtml(r.horaSalida ?? '')}</td>
          <td>${escapeHtml(formatMinutos(r.minutosTrabajados ?? 0))}</td>
          <td class="muted">${escapeHtml(estado)}</td>
        </tr>
      `;
        })
        .join('');

    const docTitle = title?.trim() ? title.trim() : 'Reporte de Asistencia';

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(docTitle)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { color: #555; font-size: 12px; margin: 0 0 10px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .box { border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 14px; }
    .k { color: #666; font-size: 11px; }
    .v { font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #eee; padding: 8px 6px; vertical-align: top; font-size: 12px; }
    th { text-align: left; background: #fafafa; font-size: 11px; color: #555; }
    .weekend { opacity: .9; }
    .muted { color: #666; }
    .dateCell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .date { font-weight: 600; }
    .alertIcon { font-size: 12px; }
    .pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 10px; border: 1px solid #ddd; }
    .pill-ok { border-color: #2e7d32; color: #2e7d32; }
    .pill-warn { border-color: #ed6c02; color: #ed6c02; }
    .pill-danger { border-color: #d32f2f; color: #d32f2f; }
    .pill-out { border-color: #999; color: #666; }
    .footer { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .sign { height: 60px; border-top: 1px solid #bbb; padding-top: 6px; color: #666; font-size: 11px; }
    .noPrint { margin-top: 10px; font-size: 12px; color: #666; }
    @media print { .noPrint { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(docTitle)}</h1>
      <p class="sub">
        Usuario: <b>${escapeHtml(usuarioNombre)}</b> · Rango: <b>${escapeHtml(desde)} → ${escapeHtml(hasta)}</b>
      </p>
      <p class="sub">Generado: ${escapeHtml(generado)}</p>
    </div>
    <div class="box" style="min-width: 240px;">
      <div class="k">Totales</div>
      <div class="v">Trabajado: ${escapeHtml(formatMinutos(trabajadoTotal))}</div>
      ${objetivoTotal > 0 ? `<div class="v">Objetivo: ${escapeHtml(formatMinutos(objetivoTotal))}</div>` : ''}
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="k">Días con registro</div>
      <div class="v">${diasConRegistro}</div>
    </div>
    <div class="box">
      <div class="k">Días sin registro</div>
      <div class="v">${diasSinRegistro}</div>
    </div>
    <div class="box">
      <div class="k">Días con permiso</div>
      <div class="v">${diasPermiso}</div>
    </div>
    <div class="box">
      <div class="k">Fines de semana</div>
      <div class="v">${diasFds}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Entrada</th>
        <th>Salida</th>
        <th>Total</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <div class="sign">Firma funcionario</div>
    <div class="sign">Firma RRHH / Responsable</div>
  </div>

  <div class="noPrint">
    Si no se abre el diálogo de impresión, presiona <b>Ctrl/Cmd + P</b>.
  </div>
</body>
</html>`;
}

export function printAttendanceReport(params: {
    usuarioNombre: string;
    rows: AsistenciaResumenDiario[];
    title?: string;
    autoPrint?: boolean;
}) {
    const { autoPrint = true } = params;

    const w = window.open('', '_blank');
    if (!w) {
        alert('No se pudo abrir la ventana (popup bloqueado).');
        return;
    }

    const html = buildHtml(params);

    w.document.open();
    w.document.write(html);
    w.document.close();

    if (autoPrint) {
        setTimeout(() => {
            w.focus();
            w.print();
        }, 150);
    } else {
        setTimeout(() => w.focus(), 50);
    }
}