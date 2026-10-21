"use server";

import { prisma } from "@/lib/prisma";
import { consolidarHorasMensuales, ResumenMensualEmpleado, TurnoInput } from "@/lib/reports";

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
