"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLocales() {
  try {
    const locales = await prisma.local.findMany({
      orderBy: { nombreLocal: "asc" },
      include: {
        _count: {
          select: {
            empleados: true,
            turnos: { where: { activo: true } },
          },
        },
      },
    });
    return { success: true, data: locales };
  } catch (error: any) {
    console.error("Error al obtener locales:", error);
    return { success: false, error: "No se pudieron cargar los locales.", data: [] };
  }
}

export async function guardarLocal(formData: {
  id?: string;
  codigo: string;
  nombreLocal: string;
  direccion: string;
  activo?: boolean;
}) {
  try {
    const { id, codigo, nombreLocal, direccion, activo = true } = formData;

    if (!codigo.trim() || !nombreLocal.trim() || !direccion.trim()) {
      return { success: false, error: "Todos los campos son obligatorios." };
    }

    if (id) {
      // Edición
      const local = await prisma.local.update({
        where: { id },
        data: {
          codigo: codigo.trim().toUpperCase(),
          nombreLocal: nombreLocal.trim(),
          direccion: direccion.trim(),
          activo,
        },
      });
      revalidatePath("/locales");
      revalidatePath("/turnos");
      return { success: true, data: local };
    } else {
      // Alta
      const existing = await prisma.local.findUnique({
        where: { codigo: codigo.trim().toUpperCase() },
      });
      if (existing) {
        return { success: false, error: "El código de local ya está registrado." };
      }

      const local = await prisma.local.create({
        data: {
          codigo: codigo.trim().toUpperCase(),
          nombreLocal: nombreLocal.trim(),
          direccion: direccion.trim(),
          activo,
        },
      });
      revalidatePath("/locales");
      revalidatePath("/turnos");
      return { success: true, data: local };
    }
  } catch (error: any) {
    console.error("Error al guardar local:", error);
    return { success: false, error: error.message || "Error al procesar el local." };
  }
}

/**
 * 1er Paso: Baja lógica (desactiva el local para que no aparezca en nuevas asignaciones)
 */
export async function darBajaLogicaLocal(id: string) {
  try {
    await prisma.local.update({
      where: { id },
      data: { activo: false },
    });
    revalidatePath("/locales");
    revalidatePath("/turnos");
    revalidatePath("/empleados");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "No se pudo dar de baja lógica al local." };
  }
}

export async function alternarEstadoLocal(id: string, activoActual: boolean) {
  if (activoActual) {
    return darBajaLogicaLocal(id);
  } else {
    return reactivarLocal(id);
  }
}

/**
 * Reactivar un local que estaba en baja lógica
 */
export async function reactivarLocal(id: string) {
  try {
    await prisma.local.update({
      where: { id },
      data: { activo: true },
    });
    revalidatePath("/locales");
    revalidatePath("/turnos");
    revalidatePath("/empleados");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "No se pudo reactivar el local." };
  }
}

/**
 * 2do Paso: Baja definitiva (eliminación física de la BD tras previa baja lógica)
 */
export async function darBajaDefinitivaLocal(id: string) {
  try {
    const local = await prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      return { success: false, error: "El local no existe." };
    }

    if (local.activo) {
      return {
        success: false,
        error: "Para dar de baja definitiva, primero debes dar de baja lógica (desactivar) el local.",
      };
    }

    await prisma.local.delete({
      where: { id },
    });

    revalidatePath("/locales");
    revalidatePath("/turnos");
    revalidatePath("/empleados");
    revalidatePath("/reportes");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar definitivamente local:", error);
    return { success: false, error: "Error al eliminar definitivamente el local." };
  }
}
