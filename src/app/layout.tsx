import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "TurnoMaster - Sistema de Control de Personal y Turnos",
  description: "Gestión de personal, asignación de turnos 24/7 y reportes mensuales de horas.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans">
        <AppShell usuario={session}>{children}</AppShell>
      </body>
    </html>
  );
}
