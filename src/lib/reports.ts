/**
 * Motor de consolidación de horas mensuales por empleado y por local.
 * Considera los días calendario reales del mes y suma tanto turnos recurrentes como turnos puntuales.
 */

import { DIAS_SEMANA } from "./utils";

export interface TurnoInput {
  id: string;
  empleadoId: string;
  localId: string;
  local: {
    id: string;
    nombreLocal: string;
    codigo: string;
  };
  tipo: "RECURRENTE" | "PUNTUAL";
  diaSemana: number | null; // 1-7
  fecha: Date | string | null;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  duracionHoras: number;
  activo: boolean;
}

export interface DesgloseLocal {
  localId: string;
  nombreLocal: string;
  codigo: string;
  totalHoras: number;
  turnosCount: number;
}

export interface DetalleDiaTurno {
  fechaStr: string; // YYYY-MM-DD
  diaSemanaId: number;
  diaNombre: string;
  localId: string;
  localNombre: string;
  horario: string;
  duracionHoras: number;
  tipo: "RECURRENTE" | "PUNTUAL";
}

export interface ResumenMensualEmpleado {
  empleadoId: string;
  anio: number;
  mes: number;
  totalHorasMes: number;
  totalTurnosMes: number;
  desglosePorLocal: DesgloseLocal[];
  historialTurnos: DetalleDiaTurno[];
}

export function consolidarHorasMensuales(
  anio: number,
  mes: number, // 1-12
  empleadoId: string,
  turnos: TurnoInput[]
): ResumenMensualEmpleado {
  // Días en el mes (el día 0 del siguiente mes da el último día del mes en cuestión)
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const desgloseMap = new Map<string, DesgloseLocal>();
  const historialTurnos: DetalleDiaTurno[] = [];
  let totalHorasMes = 0;

  // Filtrar turnos activos del empleado
  const turnosEmpleado = turnos.filter((t) => t.empleadoId === empleadoId && t.activo);

  // Recorrer cada día calendario del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaActual = new Date(Date.UTC(anio, mes - 1, dia));
    // getUTCDay: 0=Dom, 1=Lun, ..., 6=Sáb
    const dayIndex = fechaActual.getUTCDay();
    const diaSemanaId = dayIndex === 0 ? 7 : dayIndex;
    const diaSemanaNombre = DIAS_SEMANA.find((d) => d.id === diaSemanaId)?.nombre || "Día";
    const fechaIsoStr = `${anio}-${mes.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;

    // 1. Turnos recurrentes para este día de la semana
    const turnosRecurrentes = turnosEmpleado.filter(
      (t) => t.tipo === "RECURRENTE" && t.diaSemana === diaSemanaId
    );

    // 2. Turnos puntuales para esta fecha específica
    const turnosPuntuales = turnosEmpleado.filter((t) => {
      if (t.tipo !== "PUNTUAL" || !t.fecha) return false;
      const fStr = typeof t.fecha === "string" ? t.fecha.substring(0, 10) : t.fecha.toISOString().substring(0, 10);
      return fStr === fechaIsoStr;
    });

    const turnosDelDia = [...turnosRecurrentes, ...turnosPuntuales];

    for (const t of turnosDelDia) {
      totalHorasMes += t.duracionHoras;

      // Actualizar desglose por local
      const currentLocal = desgloseMap.get(t.localId) || {
        localId: t.localId,
        nombreLocal: t.local.nombreLocal,
        codigo: t.local.codigo,
        totalHoras: 0,
        turnosCount: 0,
      };
      currentLocal.totalHoras += t.duracionHoras;
      currentLocal.turnosCount += 1;
      desgloseMap.set(t.localId, currentLocal);

      // Agregar a historial
      historialTurnos.push({
        fechaStr: fechaIsoStr,
        diaSemanaId,
        diaNombre: diaSemanaNombre,
        localId: t.localId,
        localNombre: t.local.nombreLocal,
        horario: `${t.horaInicio} - ${t.horaFin}${t.cruzaMedianoche ? " (+1)" : ""}`,
        duracionHoras: t.duracionHoras,
        tipo: t.tipo,
      });
    }
  }

  // Redondear a 2 decimales
  totalHorasMes = Number(totalHorasMes.toFixed(2));
  const desglosePorLocal = Array.from(desgloseMap.values()).map((d) => ({
    ...d,
    totalHoras: Number(d.totalHoras.toFixed(2)),
  }));

  // Ordenar historial cronológicamente
  historialTurnos.sort((a, b) => a.fechaStr.localeCompare(b.fechaStr));

  return {
    empleadoId,
    anio,
    mes,
    totalHorasMes,
    totalTurnosMes: historialTurnos.length,
    desglosePorLocal,
    historialTurnos,
  };
}

export interface LiquidacionEmpleadoRango {
  empleadoId: string;
  nombreCompleto: string;
  dni: string;
  rol: string;
  horasTrabajadas: number;
  diasVacacionesLiquidados: number;
  horasVacacionesLiquidadas: number;
  totalHorasALiquidar: number;
  desgloseLocales: Array<{ localNombre: string; horas: number }>;
  detalleTurnos: Array<{ fechaStr: string; localNombre: string; horario: string; duracionHoras: number }>;
  detalleVacaciones: Array<{ fechaStr: string; dias: number; horas: number; observaciones: string | null }>;
}

export interface ReporteLiquidacionGeneral {
  fechaDesde: string;
  fechaHasta: string;
  totalHorasTrabajadasEmpresa: number;
  totalHorasVacacionesEmpresa: number;
  totalGeneralHorasLiquidar: number;
  empleados: LiquidacionEmpleadoRango[];
}

export function consolidarLiquidacionHorasRango(
  fechaDesdeStr: string, // YYYY-MM-DD
  fechaHastaStr: string, // YYYY-MM-DD
  empleados: Array<{ id: string; nombre: string; apellido: string; dni: string; rol: string }>,
  turnos: TurnoInput[],
  vacacionesLiquidadas: Array<{
    empleadoId: string;
    fechaInicio: Date | string;
    diasTomados: number;
    horasLiquidadas: number | null;
    observaciones: string | null;
  }>
): ReporteLiquidacionGeneral {
  const dInicio = new Date(fechaDesdeStr + "T00:00:00.000Z");
  const dFin = new Date(fechaHastaStr + "T23:59:59.999Z");

  const empleadosResult: LiquidacionEmpleadoRango[] = [];
  let totalHorasTrabajadasEmpresa = 0;
  let totalHorasVacacionesEmpresa = 0;

  for (const emp of empleados) {
    const turnosEmp = turnos.filter((t) => t.empleadoId === emp.id && t.activo);
    const desgloseMap = new Map<string, number>();
    const detalleTurnos: Array<{ fechaStr: string; localNombre: string; horario: string; duracionHoras: number }> = [];
    let horasTrabajadas = 0;

    // Recorrer cada día en el rango de fechas
    const cur = new Date(dInicio);
    while (cur <= dFin) {
      const year = cur.getUTCFullYear();
      const month = cur.getUTCMonth() + 1;
      const day = cur.getUTCDate();
      const dayOfWeekIndex = cur.getUTCDay();
      const diaSemanaId = dayOfWeekIndex === 0 ? 7 : dayOfWeekIndex;
      const fStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      // Turnos recurrentes para este día de la semana
      const rec = turnosEmp.filter((t) => t.tipo === "RECURRENTE" && t.diaSemana === diaSemanaId);

      // Turnos puntuales para esta fecha
      const punt = turnosEmp.filter((t) => {
        if (t.tipo !== "PUNTUAL" || !t.fecha) return false;
        const ptStr = typeof t.fecha === "string" ? t.fecha.substring(0, 10) : t.fecha.toISOString().substring(0, 10);
        return ptStr === fStr;
      });

      for (const t of [...rec, ...punt]) {
        horasTrabajadas += t.duracionHoras;
        desgloseMap.set(t.local.nombreLocal, (desgloseMap.get(t.local.nombreLocal) || 0) + t.duracionHoras);
        detalleTurnos.push({
          fechaStr: fStr,
          localNombre: t.local.nombreLocal,
          horario: `${t.horaInicio} - ${t.horaFin}${t.cruzaMedianoche ? " (+1)" : ""}`,
          duracionHoras: t.duracionHoras,
        });
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // Vacaciones liquidadas en el rango de fechas
    const vacsEmp = vacacionesLiquidadas.filter((v) => {
      if (v.empleadoId !== emp.id) return false;
      const vFecha = new Date(v.fechaInicio);
      return vFecha >= dInicio && vFecha <= dFin;
    });

    let diasVacacionesLiquidados = 0;
    let horasVacacionesLiquidadas = 0;
    const detalleVacaciones: Array<{ fechaStr: string; dias: number; horas: number; observaciones: string | null }> = [];

    for (const v of vacsEmp) {
      diasVacacionesLiquidados += v.diasTomados;
      const h = v.horasLiquidadas || 0;
      horasVacacionesLiquidadas += h;
      const vStr = typeof v.fechaInicio === "string" ? v.fechaInicio.substring(0, 10) : v.fechaInicio.toISOString().substring(0, 10);
      detalleVacaciones.push({
        fechaStr: vStr,
        dias: v.diasTomados,
        horas: h,
        observaciones: v.observaciones,
      });
    }

    horasTrabajadas = Number(horasTrabajadas.toFixed(2));
    horasVacacionesLiquidadas = Number(horasVacacionesLiquidadas.toFixed(2));
    const totalHorasALiquidar = Number((horasTrabajadas + horasVacacionesLiquidadas).toFixed(2));

    totalHorasTrabajadasEmpresa += horasTrabajadas;
    totalHorasVacacionesEmpresa += horasVacacionesLiquidadas;

    empleadosResult.push({
      empleadoId: emp.id,
      nombreCompleto: `${emp.nombre} ${emp.apellido}`,
      dni: emp.dni,
      rol: emp.rol,
      horasTrabajadas,
      diasVacacionesLiquidados,
      horasVacacionesLiquidadas,
      totalHorasALiquidar,
      desgloseLocales: Array.from(desgloseMap.entries()).map(([localNombre, horas]) => ({
        localNombre,
        horas: Number(horas.toFixed(2)),
      })),
      detalleTurnos,
      detalleVacaciones,
    });
  }

  return {
    fechaDesde: fechaDesdeStr,
    fechaHasta: fechaHastaStr,
    totalHorasTrabajadasEmpresa: Number(totalHorasTrabajadasEmpresa.toFixed(2)),
    totalHorasVacacionesEmpresa: Number(totalHorasVacacionesEmpresa.toFixed(2)),
    totalGeneralHorasLiquidar: Number((totalHorasTrabajadasEmpresa + totalHorasVacacionesEmpresa).toFixed(2)),
    empleados: empleadosResult,
  };
}
