"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, removeSession, getSession, requireSuperusuario } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: { usuario?: string; email?: string; password: string }) {
  try {
    const rawIdentifier = (formData.usuario || formData.email || "").trim().toLowerCase();
    const { password } = formData;
    if (!rawIdentifier || !password) {
      return { success: false, error: "Ingresa tu usuario y contraseña." };
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: rawIdentifier },
          { email: rawIdentifier },
        ],
      },
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
        username: true,
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
  username?: string;
  email?: string;
  password: string;
}) {
  const session = await requireSuperusuario();

  const { nombre, password } = data;
  let username = (data.username || "").trim().toLowerCase();
  let email = (data.email || "").trim().toLowerCase();

  if (!nombre.trim() || !password) {
    return { success: false, error: "El nombre y la contraseña son obligatorios." };
  }

  // Generar username automático si no se ingresó
  if (!username) {
    username = nombre.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // Generar email automático si no se ingresó
  if (!email) {
    email = `${username}@turnomaster.com`;
  }

  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const existingEmail = await prisma.usuario.findUnique({
    where: { email },
  });
  if (existingEmail) {
    return { success: false, error: "Ya existe un usuario con este correo." };
  }

  const existingUsername = await prisma.usuario.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return { success: false, error: `Ya existe un usuario con el nombre de usuario '${username}'.` };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const nuevo = await prisma.usuario.create({
    data: {
      nombre: nombre.trim(),
      username,
      email,
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
