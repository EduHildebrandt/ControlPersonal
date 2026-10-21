"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEmpleados() {
  try {
    const empleados = await prisma.empleado.findMany({
      orderBy: { apellido: "asc" },
      include: {
        locales: {
          include: {
            local: true,
          },
        },
        _count: {
          select: {
            turnos: { where: { activo: true } },
          },
        },
      },
    });
    return { success: true, data: empleados };
  } catch (error: any) {
    console.error("Error al obtener empleados:", error);
    return { success: false, error: "No se pudieron cargar los empleados.", data: [] };
  }
}

export async function getEmpleadoById(id: string) {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        locales: {
          include: {
            local: true,
          },
        },
        turnos: {
          where: { activo: true },
          include: {
            local: true,
          },
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
        },
      },
    });
    return { success: true, data: empleado };
  } catch (error: any) {
    return { success: false, error: "Empleado no encontrado." };
  }
}

export async function guardarEmpleado(formData: {
  id?: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  rol: string;
  activo?: boolean;
  localesIds?: string[]; // IDs de locales habilitados
}) {
  try {
    const { id, nombre, apellido, dni, telefono, rol, activo = true, localesIds = [] } = formData;

    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      return { success: false, error: "Nombre, Apellido y DNI son campos obligatorios." };
    }

    if (id) {
      // Validar DNI único excluyendo a este empleado
      const existingDni = await prisma.empleado.findFirst({
        where: {
          dni: dni.trim(),
          NOT: { id },
        },
      });
      if (existingDni) {
        return { success: false, error: "El DNI ingresado ya pertenece a otro empleado." };
      }

      // Actualizar empleado y sincronizar relación N:M de locales
      await prisma.$transaction(async (tx) => {
        await tx.empleado.update({
          where: { id },
          data: {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            dni: dni.trim(),
            telefono: telefono?.trim() || null,
            rol: rol.trim() || "Operador",
            activo,
          },
        });

        // Eliminar asignaciones previas de locales
        await tx.empleadoLocal.deleteMany({
          where: { empleadoId: id },
        });

        // Crear nuevas asociaciones
        if (localesIds.length > 0) {
          await tx.empleadoLocal.createMany({
            data: localesIds.map((localId) => ({
              empleadoId: id,
              localId,
            })),
          });
        }
      });

      revalidatePath("/empleados");
      revalidatePath("/turnos");
      revalidatePath("/reportes");
      return { success: true };
    } else {
      // Alta de nuevo empleado
      const existingDni = await prisma.empleado.findUnique({
        where: { dni: dni.trim() },
      });
      if (existingDni) {
        return { success: false, error: "Ya existe un empleado registrado con este DNI." };
      }

      const empleado = await prisma.empleado.create({
        data: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          dni: dni.trim(),
          telefono: telefono?.trim() || null,
          rol: rol.trim() || "Operador",
          activo,
          locales: {
            create: localesIds.map((localId) => ({
              localId,
            })),
          },
        },
      });

      revalidatePath("/empleados");
      revalidatePath("/turnos");
      return { success: true, data: empleado };
    }
  } catch (error: any) {
    console.error("Error al guardar empleado:", error);
    return { success: false, error: error.message || "Error al procesar el empleado." };
  }
}

/**
 * 1er Paso: Baja lógica del empleado
 */
export async function darBajaLogicaEmpleado(id: string) {
  try {
    await prisma.empleado.update({
      where: { id },
      data: { activo: false },
    });
    revalidatePath("/empleados");
    revalidatePath("/turnos");
    revalidatePath("/reportes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "No se pudo dar de baja lógica al empleado." };
  }
}

/**
 * Reactivar un empleado en baja lógica
 */
export async function reactivarEmpleado(id: string) {
  try {
    await prisma.empleado.update({
      where: { id },
      data: { activo: true },
    });
    revalidatePath("/empleados");
    revalidatePath("/turnos");
    revalidatePath("/reportes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "No se pudo reactivar al empleado." };
  }
}

/**
 * 2do Paso: Baja definitiva (eliminación física de la BD tras previa baja lógica)
 */
export async function darBajaDefinitivaEmpleado(id: string) {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id },
    });

    if (!empleado) {
      return { success: false, error: "El empleado no existe." };
    }

    if (empleado.activo) {
      return {
        success: false,
        error: "Para dar de baja definitiva, primero debes dar de baja lógica (desactivar) al empleado.",
      };
    }

    await prisma.empleado.delete({
      where: { id },
    });

    revalidatePath("/empleados");
    revalidatePath("/turnos");
    revalidatePath("/reportes");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar definitivamente empleado:", error);
    return { success: false, error: "Error al eliminar definitivamente al empleado." };
  }
}

export async function alternarEstadoEmpleado(id: string, activoActual: boolean) {
  if (activoActual) {
    return darBajaLogicaEmpleado(id);
  } else {
    return reactivarEmpleado(id);
  }
}
