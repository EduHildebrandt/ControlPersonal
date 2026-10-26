"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  Clock,
  ShieldCheck,
  UserCog,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/empleados", label: "Personal", icon: Users },
  { href: "/locales", label: "Locales / Sucursales", icon: Building2 },
  { href: "/turnos", label: "Grilla de Turnos 24/7", icon: CalendarDays },
  { href: "/reportes", label: "Reportes Mensuales", icon: FileSpreadsheet },
];

interface SidebarProps {
  usuario?: {
    nombre: string;
    email: string;
    rol: "SUPERUSUARIO" | "SUPERVISOR";
  } | null;
}

export function Sidebar({ usuario }: SidebarProps) {
  const pathname = usePathname();

  // No mostrar la barra lateral en la página de login
  if (pathname === "/login") return null;

  const isSuperusuario = usuario?.rol === "SUPERUSUARIO";

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40">
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

        {/* Módulo exclusivo de Superusuario */}
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
              <UserCog className={cn("w-4 h-4 shrink-0", pathname === "/usuarios" ? "text-white" : "text-amber-400")} />
              <span>Gestión de Supervisores</span>
            </Link>
          </>
        )}
      </nav>

      {/* Perfil de Usuario y Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <User className="w-4 h-4" />
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
  );
}
