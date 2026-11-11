"use server";

import { prisma } from "@/lib/prisma";
import {
  consolidarHorasMensuales,
  consolidarLiquidacionHorasRango,
  ResumenMensualEmpleado,
  ReporteLiquidacionGeneral,
  TurnoInput,
} from "@/lib/reports";

export async function getReporteLiquidacionHoras(
  fechaDesdeStr: string,
  fechaHastaStr: string,
  empleadoId?: string
): Promise<{ success: boolean; data?: ReporteLiquidacionGeneral; error?: string }> {
  try {
    if (!fechaDesdeStr || !fechaHastaStr) {
      return { success: false, error: "Debes seleccionar las fechas Desde y Hasta." };
    }

    const whereEmp: any = { activo: true };
    if (empleadoId && empleadoId !== "ALL") {
      whereEmp.id = empleadoId;
    }

    const [empleadosDb, turnosDb, vacacionesDb] = await Promise.all([
      prisma.empleado.findMany({
        where: whereEmp,
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        select: {
          id: true,
          nombre: true,
          apellido: true,
          dni: true,
          rol: true,
        },
      }),
      prisma.asignacionTurno.findMany({
        where: {
          activo: true,
          ...(empleadoId && empleadoId !== "ALL" ? { empleadoId } : {}),
        },
        include: {
          local: true,
        },
      }),
      prisma.vacacion.findMany({
        where: {
          tipo: "LIQUIDADA",
          ...(empleadoId && empleadoId !== "ALL" ? { empleadoId } : {}),
        },
      }),
    ]);

    const turnosInput: TurnoInput[] = turnosDb.map((t) => ({
      id: t.id,
      empleadoId: t.empleadoId,
      localId: t.localId,
      local: {
        id: t.local.id,
        nombreLocal: t.local.nombreLocal,
        codigo: t.local.codigo,
      },
      tipo: t.tipo as "RECURRENTE" | "PUNTUAL",
      diaSemana: t.diaSemana,
      fecha: t.fecha,
      horaInicio: t.horaInicio,
      horaFin: t.horaFin,
      cruzaMedianoche: t.cruzaMedianoche,
      duracionHoras: t.duracionHoras,
      activo: t.activo,
    }));

    const reporte = consolidarLiquidacionHorasRango(
      fechaDesdeStr,
      fechaHastaStr,
      empleadosDb,
      turnosInput,
      vacacionesDb
    );

    return { success: true, data: reporte };
  } catch (error: any) {
    console.error("Error al generar reporte de liquidación de horas:", error);
    return { success: false, error: "Error al calcular la liquidación de horas." };
  }
}

export async function getReporteMensualEmpleado(
  empleadoId: string,
  anio: number,
  mes: number
): Promise<{ success: boolean; data?: ResumenMensualEmpleado; empleado?: any; error?: string }> {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        locales: {
          include: { local: true },
        },
      },
    });

    if (!empleado) {
      return { success: false, error: "Empleado no encontrado." };
    }

    // Traer todos los turnos del empleado
    const turnosDb = await prisma.asignacionTurno.findMany({
      where: {
        empleadoId,
        activo: true,
      },
      include: {
        local: true,
      },
    });

    const turnosInput: TurnoInput[] = turnosDb.map((t) => ({
      id: t.id,
      empleadoId: t.empleadoId,
      localId: t.localId,
      local: {
        id: t.local.id,
        nombreLocal: t.local.nombreLocal,
        codigo: t.local.codigo,
      },
      tipo: t.tipo as "RECURRENTE" | "PUNTUAL",
      diaSemana: t.diaSemana,
      fecha: t.fecha,
      horaInicio: t.horaInicio,
      horaFin: t.horaFin,
      cruzaMedianoche: t.cruzaMedianoche,
      duracionHoras: t.duracionHoras,
      activo: t.activo,
    }));

    const resumen = consolidarHorasMensuales(anio, mes, empleadoId, turnosInput);

    return {
      success: true,
      data: resumen,
      empleado: {
        id: empleado.id,
        nombreCompleto: `${empleado.nombre} ${empleado.apellido}`,
        dni: empleado.dni,
        rol: empleado.rol,
        telefono: empleado.telefono,
      },
    };
  } catch (error: any) {
    console.error("Error al calcular reporte mensual:", error);
    return { success: false, error: "Error al generar el reporte mensual." };
  }
}

export async function getMetricasGenerales() {
  try {
    const [totalEmpleados, totalLocales, totalTurnos] = await Promise.all([
      prisma.empleado.count({ where: { activo: true } }),
      prisma.local.count({ where: { activo: true } }),
      prisma.asignacionTurno.count({ where: { activo: true } }),
    ]);

    return {
      success: true,
      data: {
        totalEmpleados,
        totalLocales,
        totalTurnos,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      data: { totalEmpleados: 0, totalLocales: 0, totalTurnos: 0 },
    };
  }
}
