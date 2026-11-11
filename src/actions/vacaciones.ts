"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ResumenVacacionEmpleado {
  empleadoId: string;
  nombre: string;
  apellido: string;
  dni: string;
  rol: string;
  activo: boolean;
  diasVacacionesTotales: number;
  diasTomados: number;
  diasRestantes: number;
  vacaciones: Array<{
    id: string;
    fechaInicio: Date;
    fechaFin: Date;
    diasTomados: number;
    observaciones: string | null;
    createdAt: Date;
  }>;
}

/**
 * Obtiene el resumen general de vacaciones de todos los empleados activos
 * con balance de días asignados, tomados y restantes.
 */
export async function getResumenVacaciones() {
  try {
    const empleados = await prisma.empleado.findMany({
      orderBy: { apellido: "asc" },
      include: {
        vacaciones: {
          orderBy: { fechaInicio: "desc" },
        },
      },
    });

    const resumen: ResumenVacacionEmpleado[] = empleados.map((emp) => {
      const diasTomados = emp.vacaciones.reduce((acc, v) => acc + v.diasTomados, 0);
      const diasRestantes = Math.max(0, emp.diasVacacionesTotales - diasTomados);

      return {
        empleadoId: emp.id,
        nombre: emp.nombre,
        apellido: emp.apellido,
        dni: emp.dni,
        rol: emp.rol,
        activo: emp.activo,
        diasVacacionesTotales: emp.diasVacacionesTotales,
        diasTomados,
        diasRestantes,
        vacaciones: emp.vacaciones,
      };
    });

    return { success: true, data: resumen };
  } catch (error: any) {
    console.error("Error al obtener resumen de vacaciones:", error);
    return { success: false, error: "No se pudieron cargar las vacaciones.", data: [] };
  }
}

/**
 * Obtiene las vacaciones activas para un mes y año específicos para el calendario visual
 */
export async function getVacacionesCalendario(mes: number, anio: number) {
  try {
    // Primer y último día del mes
    const primerDiaMes = new Date(Date.UTC(anio, mes - 1, 1));
    const ultimoDiaMes = new Date(Date.UTC(anio, mes, 0, 23, 59, 59));

    const vacaciones = await prisma.vacacion.findMany({
      where: {
        AND: [
          { fechaInicio: { lte: ultimoDiaMes } },
          { fechaFin: { gte: primerDiaMes } },
        ],
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            rol: true,
            activo: true,
          },
        },
      },
      orderBy: { fechaInicio: "asc" },
    });

    return { success: true, data: vacaciones };
  } catch (error: any) {
    console.error("Error al obtener vacaciones del calendario:", error);
    return { success: false, error: "Error al cargar calendario de vacaciones.", data: [] };
  }
}

/**
 * Registra o actualiza una asignación de vacaciones para un empleado
 */
export async function guardarVacacion(formData: {
  id?: string;
  empleadoId: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;    // YYYY-MM-DD
  observaciones?: string;
}) {
  try {
    const { id, empleadoId, fechaInicio, fechaFin, observaciones } = formData;

    if (!empleadoId || !fechaInicio || !fechaFin) {
      return { success: false, error: "El colaborador y las fechas de inicio y fin son obligatorios." };
    }

    const start = new Date(fechaInicio + "T00:00:00.000Z");
    const end = new Date(fechaFin + "T00:00:00.000Z");

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: "Formato de fechas inválido." };
    }

    if (end < start) {
      return { success: false, error: "La fecha de fin no puede ser anterior a la fecha de inicio." };
    }

    // Calcular días naturales entre fecha inicio y fin (ambos inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diasTomados = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Verificar empleado
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        vacaciones: {
          where: id ? { NOT: { id } } : undefined,
        },
      },
    });

    if (!empleado) {
      return { success: false, error: "Colaborador no encontrado." };
    }

    // Comprobar solapamiento de vacaciones para este empleado
    const solapada = empleado.vacaciones.some((v) => {
      const vStart = new Date(v.fechaInicio);
      const vEnd = new Date(v.fechaFin);
      return start <= vEnd && end >= vStart;
    });

    if (solapada) {
      return {
        success: false,
        error: "El colaborador ya tiene un período de vacaciones registrado en esas fechas.",
      };
    }

    // Comprobar saldo de días
    const diasYaTomados = empleado.vacaciones.reduce((acc, v) => acc + v.diasTomados, 0);
    const diasDisponibles = empleado.diasVacacionesTotales - diasYaTomados;

    if (diasTomados > diasDisponibles) {
      return {
        success: false,
        error: `El colaborador dispone de ${diasDisponibles} días de vacaciones restantes (se solicitaron ${diasTomados} días).`,
      };
    }

    let vacacion;
    if (id) {
      vacacion = await prisma.vacacion.update({
        where: { id },
        data: {
          empleadoId,
          fechaInicio: start,
          fechaFin: end,
          diasTomados,
          observaciones: observaciones?.trim() || null,
        },
      });
    } else {
      vacacion = await prisma.vacacion.create({
        data: {
          empleadoId,
          fechaInicio: start,
          fechaFin: end,
          diasTomados,
          observaciones: observaciones?.trim() || null,
        },
      });
    }

    revalidatePath("/vacaciones");
    revalidatePath("/empleados");
    revalidatePath("/turnos");
    return { success: true, data: vacacion };
  } catch (error: any) {
    console.error("Error al guardar vacación:", error);
    return { success: false, error: error.message || "Error al procesar la solicitud de vacaciones." };
  }
}

/**
 * Elimina o cancela un período de vacaciones
 */
export async function eliminarVacacion(id: string) {
  try {
    await prisma.vacacion.delete({
      where: { id },
    });

    revalidatePath("/vacaciones");
    revalidatePath("/empleados");
    revalidatePath("/turnos");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar vacación:", error);
    return { success: false, error: "Error al cancelar período de vacaciones." };
  }
}
