import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "turno-master-secret-key-change-in-production-2026"
);

const COOKIE_NAME = "auth_token";

export interface SessionPayload {
  userId: string;
  email: string;
  nombre: string;
  rol: "SUPERUSUARIO" | "SUPERVISOR";
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function removeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSuperusuario() {
  const session = await getSession();
  if (!session || session.rol !== "SUPERUSUARIO") {
    throw new Error("Acceso denegado: Se requiere rol de Superusuario.");
  }
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("No autenticado.");
  }
  return session;
}
