"use server";

import { prisma } from "@/lib/prisma";
import { calcularDuracionHoras, validarConflictoRecurrente } from "@/lib/shifts";
import { revalidatePath } from "next/cache";

export async function getTurnos(filtro?: {
  empleadoId?: string;
  localId?: string;
  diaSemana?: number;
}) {
  try {
    const where: any = { activo: true };
    if (filtro?.empleadoId) where.empleadoId = filtro.empleadoId;
    if (filtro?.localId) where.localId = filtro.localId;
    if (filtro?.diaSemana) where.diaSemana = filtro.diaSemana;

    const turnos = await prisma.asignacionTurno.findMany({
      where,
      include: {
        empleado: true,
        local: true,
      },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    });

    return { success: true, data: turnos };
  } catch (error: any) {
    console.error("Error al obtener turnos:", error);
    return { success: false, error: "No se pudieron cargar los turnos.", data: [] };
  }
}

export async function guardarTurno(formData: {
  id?: string;
  empleadoId: string;
  localId: string;
  tipo: "RECURRENTE" | "PUNTUAL";
  diaSemana?: number; // 1-7
  fecha?: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  notas?: string;
}) {
  try {
    const { id, empleadoId, localId, tipo, diaSemana, fecha, horaInicio, horaFin, notas } = formData;

    if (!empleadoId || !localId || !horaInicio || !horaFin) {
      return { success: false, error: "Faltan datos obligatorios para el turno." };
    }

    if (tipo === "RECURRENTE" && (!diaSemana || diaSemana < 1 || diaSemana > 7)) {
      return { success: false, error: "Debes seleccionar un día de la semana válido (Lunes a Domingo)." };
    }

    if (tipo === "PUNTUAL" && !fecha) {
      return { success: false, error: "Debes indicar una fecha específica para turnos manuales/puntuales." };
    }

    // 1. Calcular duración y cruce de medianoche
    const { duracionHoras, cruzaMedianoche } = calcularDuracionHoras(horaInicio, horaFin);

    // 2. Comprobar que el empleado esté habilitado en este local
    const habilitado = await prisma.empleadoLocal.findUnique({
      where: {
        empleadoId_localId: {
          empleadoId,
          localId,
        },
      },
    });

    // Si no está habilitado, lo vinculamos automáticamente para agilizar la operativa
    if (!habilitado) {
      await prisma.empleadoLocal.create({
        data: { empleadoId, localId },
      });
    }

    // 3. Validación de Solapamiento para el mismo empleado
    if (tipo === "RECURRENTE" && diaSemana) {
      // Buscar todos los turnos recurrentes activos del empleado (excluyendo el que se edita)
      const turnosExistentes = await prisma.asignacionTurno.findMany({
        where: {
          empleadoId,
          tipo: "RECURRENTE",
          activo: true,
          NOT: id ? { id } : undefined,
        },
        include: { local: true },
      });

      const validacion = validarConflictoRecurrente(
        { diaSemana, horaInicio, horaFin },
        turnosExistentes.map((t) => ({
          id: t.id,
          diaSemana: t.diaSemana,
          horaInicio: t.horaInicio,
          horaFin: t.horaFin,
          localNombre: t.local.nombreLocal,
        }))
      );

      if (validacion.hayConflicto) {
        return { success: false, error: validacion.mensaje };
      }
    }

    // 4. Guardar o Actualizar turno
    let turno;
    if (id) {
      turno = await prisma.asignacionTurno.update({
        where: { id },
        data: {
          empleadoId,
          localId,
          tipo,
          diaSemana: tipo === "RECURRENTE" ? diaSemana : null,
          fecha: tipo === "PUNTUAL" && fecha ? new Date(fecha) : null,
          horaInicio,
          horaFin,
          cruzaMedianoche,
          duracionHoras,
          notas: notas?.trim() || null,
        },
      });
    } else {
      turno = await prisma.asignacionTurno.create({
        data: {
          empleadoId,
          localId,
          tipo,
          diaSemana: tipo === "RECURRENTE" ? diaSemana : null,
          fecha: tipo === "PUNTUAL" && fecha ? new Date(fecha) : null,
          horaInicio,
          horaFin,
          cruzaMedianoche,
          duracionHoras,
          notas: notas?.trim() || null,
        },
      });
    }

    revalidatePath("/turnos");
    revalidatePath("/reportes");
    return { success: true, data: turno };
  } catch (error: any) {
    console.error("Error al guardar turno:", error);
    return { success: false, error: error.message || "Error al registrar el turno." };
  }
}

export async function eliminarTurno(id: string) {
  try {
    await prisma.asignacionTurno.delete({
      where: { id },
    });
    revalidatePath("/turnos");
    revalidatePath("/reportes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "No se pudo eliminar el turno." };
  }
}
