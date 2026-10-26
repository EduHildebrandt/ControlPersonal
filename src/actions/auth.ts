"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, removeSession, getSession, requireSuperusuario } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: { email: string; password: string }) {
  try {
    const { email, password } = formData;
    if (!email || !password) {
      return { success: false, error: "Ingresa tu email y contraseña." };
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario || !usuario.activo) {
      return { success: false, error: "Credenciales inválidas o usuario inactivo." };
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return { success: false, error: "Credenciales inválidas o usuario inactivo." };
    }

    await createSession({
      userId: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol as "SUPERUSUARIO" | "SUPERVISOR",
    });

    return { success: true, rol: usuario.rol };
  } catch (error: any) {
    console.error("Error en login:", error);
    return { success: false, error: "Error al iniciar sesión." };
  }
}

export async function logout() {
  await removeSession();
  redirect("/login");
}

export async function getUsuarioActual() {
  const session = await getSession();
  return session;
}

export async function getUsuarios() {
  await requireSuperusuario();
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });
    return { success: true, data: usuarios };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener usuarios." };
  }
}

export async function crearSupervisor(data: {
  nombre: string;
  email: string;
  password: string;
}) {
  const session = await requireSuperusuario();

  const { nombre, email, password } = data;
  if (!nombre.trim() || !email.trim() || !password) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }

  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const existing = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (existing) {
    return { success: false, error: "Ya existe un usuario con este correo." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const nuevo = await prisma.usuario.create({
    data: {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      rol: "SUPERVISOR",
      activo: true,
    },
  });

  revalidatePath("/usuarios");
  return { success: true, data: nuevo };
}

export async function eliminarSupervisor(id: string) {
  const session = await requireSuperusuario();

  const target = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!target) {
    return { success: false, error: "Usuario no encontrado." };
  }

  if (target.rol === "SUPERUSUARIO") {
    return { success: false, error: "No es posible eliminar a un Superusuario." };
  }

  if (target.id === session.userId) {
    return { success: false, error: "No puedes eliminar tu propio usuario." };
  }

  await prisma.usuario.delete({
    where: { id },
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function alternarEstadoSupervisor(id: string, activoActual: boolean) {
  await requireSuperusuario();

  const target = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!target) {
    return { success: false, error: "Usuario no encontrado." };
  }

  if (target.rol === "SUPERUSUARIO") {
    return { success: false, error: "No se puede desactivar a un Superusuario." };
  }

  await prisma.usuario.update({
    where: { id },
    data: { activo: !activoActual },
  });

  revalidatePath("/usuarios");
  return { success: true };
}
