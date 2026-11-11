import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ResumenMensualEmpleado, ReporteLiquidacionGeneral } from "./reports";
import { MESES } from "./utils";

export interface EmpleadoInfoExport {
  nombreCompleto: string;
  dni: string;
  rol: string;
}

export async function exportarLiquidacionExcel(reporte: ReporteLiquidacionGeneral): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Control de Personal - Puntos y Moda";
  workbook.created = new Date();

  // HOJA 1: RESUMEN DE LIQUIDACIÓN
  const ws = workbook.addWorksheet("Liquidación de Horas");

  // Título
  ws.mergeCells("A1:G1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `REPORTE (LIQUIDACION DE HORAS) - DEL ${reporte.fechaDesde} AL ${reporte.fechaHasta}`;
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 32;

  // Totales
  ws.addRow([]);
  ws.addRow(["Período Liquidado:", `${reporte.fechaDesde} al ${reporte.fechaHasta}`, "", "Total Hs Trabajadas:", `${reporte.totalHorasTrabajadasEmpresa} hrs`]);
  ws.addRow(["Total Colaboradores:", reporte.empleados.length, "", "Total Hs Vacaciones Liquidadas:", `${reporte.totalHorasVacacionesEmpresa} hrs`]);
  ws.addRow(["", "", "", "TOTAL GENERAL A LIQUIDAR:", `${reporte.totalGeneralHorasLiquidar} hrs`]);
  ws.addRow([]);

  [3, 4, 5].forEach((rowNum) => {
    const row = ws.getRow(rowNum);
    row.getCell(1).font = { bold: true };
    row.getCell(4).font = { bold: true };
  });

  // Cabecera tabla
  const headerRow = ws.addRow([
    "Colaborador",
    "DNI / Identificación",
    "Rol / Cargo",
    "Horas Trabajadas",
    "Días Vacaciones Liquidados",
    "Horas Vacaciones Liquidadas",
    "TOTAL HORAS A LIQUIDAR",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.alignment = { horizontal: "center" };
  });

  reporte.empleados.forEach((emp) => {
    ws.addRow([
      emp.nombreCompleto,
      emp.dni,
      emp.rol,
      emp.horasTrabajadas,
      emp.diasVacacionesLiquidados,
      emp.horasVacacionesLiquidadas,
      emp.totalHorasALiquidar,
    ]);
  });

  // Fila Total
  const totalRow = ws.addRow([
    "TOTAL GENERAL EMPRESA",
    "-",
    "-",
    reporte.totalHorasTrabajadasEmpresa,
    reporte.empleados.reduce((a, b) => a + b.diasVacacionesLiquidados, 0),
    reporte.totalHorasVacacionesEmpresa,
    reporte.totalGeneralHorasLiquidar,
  ]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });

  ws.columns = [
    { width: 28 },
    { width: 20 },
    { width: 16 },
    { width: 18 },
    { width: 26 },
    { width: 28 },
    { width: 26 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function exportarLiquidacionPDF(reporte: ReporteLiquidacionGeneral) {
  const doc = new jsPDF();

  // Encabezado
  doc.setFillColor(30, 58, 138); // Dark Navy
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE (LIQUIDACION DE HORAS)", 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Período: ${reporte.fechaDesde} al ${reporte.fechaHasta}`, 145, 15);

  // Resumen
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Horas Trabajadas: ${reporte.totalHorasTrabajadasEmpresa} hrs`, 14, 32);
  doc.text(`Total Hs Vacaciones Liquidadas: ${reporte.totalHorasVacacionesEmpresa} hrs`, 80, 32);
  doc.setTextColor(37, 99, 235);
  doc.text(`TOTAL GENERAL A LIQUIDAR: ${reporte.totalGeneralHorasLiquidar} hrs`, 14, 38);

  autoTable(doc, {
    startY: 44,
    head: [[
      "Colaborador",
      "DNI",
      "Rol",
      "Hs Trabajadas",
      "Días Vac. Liq.",
      "Hs Vac. Liq.",
      "Total Horas Liq."
    ]],
    body: [
      ...reporte.empleados.map((e) => [
        e.nombreCompleto,
        e.dni,
        e.rol,
        `${e.horasTrabajadas}h`,
        e.diasVacacionesLiquidados > 0 ? `${e.diasVacacionesLiquidados}d` : "-",
        e.horasVacacionesLiquidadas > 0 ? `${e.horasVacacionesLiquidadas}h` : "-",
        `${e.totalHorasALiquidar}h`,
      ]),
      [
        "TOTAL GENERAL",
        "-",
        "-",
        `${reporte.totalHorasTrabajadasEmpresa}h`,
        `${reporte.empleados.reduce((a, b) => a + b.diasVacacionesLiquidados, 0)}d`,
        `${reporte.totalHorasVacacionesEmpresa}h`,
        `${reporte.totalGeneralHorasLiquidar}h`,
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 24 },
      2: { cellWidth: 22 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "center", cellWidth: 24 },
      5: { halign: "right", cellWidth: 24 },
      6: { halign: "right", cellWidth: 26, fontStyle: "bold" },
    },
  });

  const fileName = `Liquidacion_Horas_${reporte.fechaDesde}_al_${reporte.fechaHasta}.pdf`;
  doc.save(fileName);
}

export async function exportarReporteExcel(
  resumen: ResumenMensualEmpleado,
  empleado: EmpleadoInfoExport
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Control de Personal";
  workbook.created = new Date();

  const mesNombre = MESES.find((m) => m.id === resumen.mes)?.nombre || `Mes ${resumen.mes}`;

  // HOJA 1: RESUMEN GENERAL
  const wsResumen = workbook.addWorksheet("Resumen Mensual");

  // Título
  wsResumen.mergeCells("A1:E1");
  const titleCell = wsResumen.getCell("A1");
  titleCell.value = `REPORTE MENSUAL DE HORAS - ${mesNombre.toUpperCase()} ${resumen.anio}`;
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }, // Navy blue
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  wsResumen.getRow(1).height = 32;

  // Datos del Empleado
  wsResumen.addRow([]);
  wsResumen.addRow(["Empleado:", empleado.nombreCompleto, "", "Período:", `${mesNombre} ${resumen.anio}`]);
  wsResumen.addRow(["DNI/ID:", empleado.dni, "", "Total Horas:", `${resumen.totalHorasMes} hrs`]);
  wsResumen.addRow(["Cargo/Rol:", empleado.rol, "", "Total Turnos:", `${resumen.totalTurnosMes}`]);
  wsResumen.addRow([]);

  // Estilizar bloque de info
  [3, 4, 5].forEach((rowNum) => {
    const row = wsResumen.getRow(rowNum);
    row.getCell(1).font = { bold: true };
    row.getCell(4).font = { bold: true };
  });

  // Tabla Desglose por Local
  const localHeaderRow = wsResumen.addRow(["Código Local", "Nombre del Local", "Turnos Cumplidos", "Total Horas"]);
  localHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.alignment = { horizontal: "center" };
  });

  resumen.desglosePorLocal.forEach((item) => {
    wsResumen.addRow([item.codigo, item.nombreLocal, item.turnosCount, item.totalHoras]);
  });

  // Fila total desglose
  const totalRow = wsResumen.addRow(["", "TOTAL GENERAL", resumen.totalTurnosMes, resumen.totalHorasMes]);
  totalRow.font = { bold: true };

  // HOJA 2: DETALLE CRONOLÓGICO DE TURNOS
  const wsDetalle = workbook.addWorksheet("Detalle de Turnos");
  const detailHeaderRow = wsDetalle.addRow(["Fecha", "Día", "Local", "Horario", "Duración (h)", "Tipo"]);
  detailHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.alignment = { horizontal: "center" };
  });

  resumen.historialTurnos.forEach((t) => {
    wsDetalle.addRow([t.fechaStr, t.diaNombre, t.localNombre, t.horario, t.duracionHoras, t.tipo]);
  });

  // Auto-ajustar anchos de columnas
  [wsResumen, wsDetalle].forEach((ws) => {
    ws.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLen) maxLen = Math.min(len + 3, 35);
      });
      column.width = maxLen;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function exportarReportePDF(
  resumen: ResumenMensualEmpleado,
  empleado: EmpleadoInfoExport
): void {
  const doc = new jsPDF();
  const mesNombre = MESES.find((m) => m.id === resumen.mes)?.nombre || `Mes ${resumen.mes}`;

  // Encabezado
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SISTEMA DE CONTROL DE PERSONAL", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Informe Mensual de Horas - ${mesNombre} ${resumen.anio}`, 14, 18);

  // Ficha de Empleado
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Empleado", 14, 34);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${empleado.nombreCompleto}`, 14, 41);
  doc.text(`DNI / Identificación: ${empleado.dni}`, 14, 47);
  doc.text(`Cargo / Rol: ${empleado.rol}`, 14, 53);

  doc.text(`Período Liquidado: ${mesNombre} ${resumen.anio}`, 115, 41);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Horas Efectivas: ${resumen.totalHorasMes} hrs`, 115, 47);
  doc.text(`Total Turnos Asignados: ${resumen.totalTurnosMes}`, 115, 53);

  // Tabla 1: Desglose por Local
  autoTable(doc, {
    startY: 60,
    head: [["Código Local", "Nombre del Local", "Turnos Realizados", "Total Horas"]],
    body: [
      ...resumen.desglosePorLocal.map((l) => [
        l.codigo,
        l.nombreLocal,
        l.turnosCount.toString(),
        `${l.totalHoras} hrs`,
      ]),
      ["", "TOTAL CONSOLIDADO", resumen.totalTurnosMes.toString(), `${resumen.totalHorasMes} hrs`],
    ],
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] }, // Blue 600
    styles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 70 },
      2: { halign: "center", cellWidth: 40 },
      3: { halign: "right", cellWidth: 35 },
    },
  });

  // Tabla 2: Detalle Cronológico de Turnos
  const lastTableEnd = (doc as any).lastAutoTable?.finalY || 100;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle Cronológico de Turnos en el Mes", 14, lastTableEnd + 10);

  autoTable(doc, {
    startY: lastTableEnd + 14,
    head: [["Fecha", "Día", "Local", "Horario", "Duración", "Tipo"]],
    body: resumen.historialTurnos.map((t) => [
      t.fechaStr,
      t.diaNombre,
      t.localNombre,
      t.horario,
      `${t.duracionHoras}h`,
      t.tipo,
    ]),
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { halign: "center", cellWidth: 22 },
      5: { halign: "center", cellWidth: 20 },
    },
  });

  // Guardar archivo
  const fileName = `Reporte_${empleado.nombreCompleto.replace(/\s+/g, "_")}_${mesNombre}_${resumen.anio}.pdf`;
  doc.save(fileName);
}
