import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── EXPORTAR PDF ──────────────────────────────

export async function exportarPDF({ kpis, semanas, distribucion, citasMes }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const MARGEN = 16
  let y = MARGEN

  const now = format(new Date(), "d 'de' MMMM yyyy · HH:mm", { locale: es })

  // ── Encabezado ──
  doc.setFillColor(71, 241, 228)
  doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(0, 55, 51)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('UroGestión — Reporte Estadístico', MARGEN, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${now}`, MARGEN, 21)
  y = 38

  // ── KPIs ──
  doc.setTextColor(30, 30, 50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Indicadores Clave', MARGEN, y); y += 7

  const kpiItems = [
    ['Citas de hoy', kpis?.citasHoy ?? 0],
    ['Atendidos hoy', kpis?.atendidos ?? 0],
    ['Ausencias hoy', kpis?.ausencias ?? 0],
    ['Nuevos pacientes (mes)', kpis?.nuevosPacientes ?? 0],
    ['Total pacientes activos', kpis?.totalPacientes ?? 0],
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  kpiItems.forEach(([label, val]) => {
    doc.setDrawColor(200, 220, 220)
    doc.roundedRect(MARGEN, y, W - MARGEN * 2, 8, 2, 2, 'S')
    doc.text(label, MARGEN + 3, y + 5.5)
    doc.setFont('helvetica', 'bold')
    doc.text(String(val), W - MARGEN - 3, y + 5.5, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += 10
  })

  y += 6

  // ── Distribución por tipo ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Distribución de Consultas por Tipo', MARGEN, y); y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  distribucion.forEach(item => {
    doc.text(`• ${item.name}: ${item.value}`, MARGEN + 4, y); y += 6
  })

  y += 6

  // ── Tabla citas del mes ──
  if (citasMes?.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`Citas del Mes (${citasMes.length} registros)`, MARGEN, y); y += 8

    // Cabecera tabla
    doc.setFillColor(26, 31, 47)
    doc.setTextColor(71, 241, 228)
    doc.rect(MARGEN, y - 5, W - MARGEN * 2, 8, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    const cols = [MARGEN + 2, 50, 90, 140, 170]
    doc.text('Fecha', cols[0], y)
    doc.text('Paciente', cols[1], y)
    doc.text('Tipo', cols[2], y)
    doc.text('Estado', cols[3], y)
    y += 4
    doc.setTextColor(30, 30, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)

    citasMes.slice(0, 30).forEach((c, i) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      if (i % 2 === 0) {
        doc.setFillColor(240, 248, 248)
        doc.rect(MARGEN, y - 3, W - MARGEN * 2, 6, 'F')
      }
      const paciente = c.paciente ? `${c.paciente.nombre} ${c.paciente.apellido}` : '—'
      const fecha = format(new Date(c.fecha_hora), 'd MMM yy HH:mm', { locale: es })
      const tipo = c.tipo === 'primera_vez' ? 'Primera vez' : c.tipo === 'control' ? 'Control' : 'Procedimiento'
      doc.text(fecha, cols[0], y)
      doc.text(paciente.slice(0, 22), cols[1], y)
      doc.text(tipo, cols[2], y)
      doc.text(c.estado.replace('_', ' '), cols[3], y)
      y += 6
    })
  }

  // ── Footer ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(140, 140, 140)
    doc.text(`UroGestión · Página ${i} de ${totalPages}`, W / 2, 290, { align: 'center' })
  }

  doc.save(`UroGestion_Reporte_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`)
}

// ─── EXPORTAR EXCEL ────────────────────────────

export function exportarExcel({ kpis, citasMes }) {
  const wb = XLSX.utils.book_new()

  // Hoja KPIs
  const kpiRows = [
    ['Indicador', 'Valor'],
    ['Citas de hoy', kpis?.citasHoy ?? 0],
    ['Atendidos hoy', kpis?.atendidos ?? 0],
    ['Ausencias hoy', kpis?.ausencias ?? 0],
    ['Nuevos pacientes (mes)', kpis?.nuevosPacientes ?? 0],
    ['Total pacientes activos', kpis?.totalPacientes ?? 0],
    ['Tasa de asistencia', kpis?.citasHoy
      ? `${Math.round((kpis.atendidos / kpis.citasHoy) * 100)}%` : '—'],
  ]
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiRows)
  wsKpi['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Indicadores')

  // Hoja Citas del mes
  const citaRows = [
    ['Fecha', 'Hora', 'Paciente', 'Cédula', 'Tipo', 'Estado', 'Duración (min)'],
    ...(citasMes ?? []).map(c => [
      format(new Date(c.fecha_hora), 'dd/MM/yyyy', { locale: es }),
      format(new Date(c.fecha_hora), 'HH:mm'),
      c.paciente ? `${c.paciente.nombre} ${c.paciente.apellido}` : '—',
      c.paciente?.cedula ?? '—',
      c.tipo === 'primera_vez' ? 'Primera vez' : c.tipo === 'control' ? 'Control' : 'Procedimiento',
      c.estado.replace('_', ' '),
      c.duracion_minutos,
    ]),
  ]
  const wsCitas = XLSX.utils.aoa_to_sheet(citaRows)
  wsCitas['!cols'] = [
    { wch: 14 }, { wch: 8 }, { wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsCitas, 'Citas del Mes')

  XLSX.writeFile(wb, `UroGestion_Reporte_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`)
}
