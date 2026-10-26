import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
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
      <body className="antialiased flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar usuario={session} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
