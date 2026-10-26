"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Clock,
  Calendar,
  CheckCircle2,
  Users,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/empleados", label: "Personal", icon: Users },
  { href: "/locales", label: "Locales / Sucursales", icon: Building2 },
  { href: "/turnos", label: "Grilla de Turnos 24/7", icon: CalendarDays },
  { href: "/reportes", label: "Reportes Mensuales", icon: FileSpreadsheet },
];

interface AppShellProps {
  children: React.ReactNode;
  usuario?: {
    nombre: string;
    email: string;
    rol: "SUPERUSUARIO" | "SUPERVISOR";
  } | null;
}

export function AppShell({ children, usuario }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("es-ES", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };
    updateTime();
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Si es la página de login, no mostrar la estructura de navegación
  if (pathname === "/login") {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  const isSuperusuario = usuario?.rol === "SUPERUSUARIO";

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* 1. SIDEBAR DE ESCRITORIO (md y superior) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col shrink-0 min-h-screen border-r border-slate-800 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block">TurnoMaster</span>
            <span className="text-[11px] text-blue-400 font-medium block">Control de Personal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Módulos Principales
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Módulo de Administración de Superusuario */}
          {isSuperusuario && (
            <>
              <div className="px-3 pt-4 pb-2 text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                Administración
              </div>
              <Link
                href="/usuarios"
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  pathname === "/usuarios"
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <UserCog
                  className={cn("w-4 h-4 shrink-0", pathname === "/usuarios" ? "text-white" : "text-amber-400")}
                />
                <span>Gestión de Supervisores</span>
              </Link>
            </>
          )}
        </nav>

        {/* Perfil de Usuario y Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {usuario?.nombre || "Usuario"}
                </p>
                <span
                  className={cn(
                    "inline-block px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight uppercase",
                    isSuperusuario
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  )}
                >
                  {usuario?.rol || "SUPERVISOR"}
                </span>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">PostgreSQL (Supabase Ready)</span>
          </div>
        </div>
      </aside>

      {/* 2. DRAWER / MENÚ MÓVIL (celulares y tablets < md) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop con desenfoque */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Sidebar */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 text-slate-100 flex flex-col h-full shadow-2xl z-10 border-r border-slate-800 animate-in slide-in-from-left duration-200">
            {/* Header del Drawer */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">TurnoMaster</span>
                  <span className="text-[10px] text-blue-400 font-medium block">Control Horario</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links del Menú */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Módulos
              </div>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition",
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isSuperusuario && (
                <>
                  <div className="px-3 pt-4 pb-2 text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                    Administración
                  </div>
                  <Link
                    href="/usuarios"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition",
                      pathname === "/usuarios"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    )}
                  >
                    <UserCog
                      className={cn("w-4 h-4 shrink-0", pathname === "/usuarios" ? "text-white" : "text-amber-400")}
                    />
                    <span>Gestión de Supervisores</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Perfil en Drawer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {usuario?.nombre || "Usuario"}
                    </p>
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase",
                        isSuperusuario
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      )}
                    >
                      {usuario?.rol || "SUPERVISOR"}
                    </span>
                  </div>
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ÁREA PRINCIPAL DE CONTENIDO */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* NAVBAR RESPONSIVO */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Botón Hamburguesa móvil */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition focus:outline-none"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo en móvil */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 truncate">TurnoMaster</span>
            </div>

            {/* Título en tablet y PC */}
            <h1 className="hidden md:block text-base lg:text-lg font-semibold text-slate-800 tracking-tight truncate">
              Panel de Administración y Control Horario
            </h1>
          </div>

          {/* Badges de estado a la derecha */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            {/* Fecha (oculta en móviles muy pequeños para no apretar) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{currentDateTime || "Fecha"}</span>
            </div>

            {/* Estado del sistema */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden xs:inline">Sistema Activo</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO DE LA PÁGINA */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
