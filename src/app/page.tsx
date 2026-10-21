import Link from "next/link";
import {
  Users,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Moon,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import { getMetricasGenerales } from "@/actions/reportes";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metricasRes = await getMetricasGenerales();
  const metricas = metricasRes.data || { totalEmpleados: 0, totalLocales: 0, totalTurnos: 0 };

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-4 border border-blue-400/20">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            Sistema de Gestión y Control Horario
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Control de Personal y Asignación de Turnos
          </h1>
          <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Plataforma centralizada para la administración de nómina, asignación de turnos 24/7 con soporte para turnos nocturnos, prevención automática de solapamientos y liquidación de horas mensuales.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/turnos"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-blue-900 text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm"
            >
              <CalendarDays className="w-4 h-4 text-blue-700" />
              <span>Gestionar Grilla de Turnos</span>
            </Link>
            <Link
              href="/reportes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-950/40 border border-blue-400/30 text-white text-sm font-medium hover:bg-blue-950/60 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ver Reportes Mensuales</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Personal Registrado
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{metricas.totalEmpleados}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Link href="/empleados" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
              Ver empleados <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Sucursales / Locales
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{metricas.totalLocales}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Link href="/locales" className="text-emerald-600 hover:underline font-medium inline-flex items-center gap-1">
              Ver sucursales <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Turnos Asignados
            </span>
            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{metricas.totalTurnos}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Link href="/turnos" className="text-violet-600 hover:underline font-medium inline-flex items-center gap-1">
              Ver grilla semanal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Cobertura 24hs
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">24/7</p>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cruce de medianoche habilitado
          </div>
        </div>
      </div>

      {/* Reglas de Negocio & Características */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            01
          </div>
          <h3 className="text-base font-bold text-slate-800">Turnos Manuales y Recurrentes</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Asigna turnos fijos semanales (ej. todos los martes de 08:00 a 16:00) o turnos para fechas puntuales del calendario sin esfuerzo.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            02
          </div>
          <h3 className="text-base font-bold text-slate-800">Protección Anti-Solapamientos</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            El motor de validación detecta colisiones de horario en tiempo real, imposibilitando que un empleado esté asignado en dos locales al mismo tiempo.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            03
          </div>
          <h3 className="text-base font-bold text-slate-800">Exportación a Excel y PDF</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Consolidación de horas brutas efectivas del mes calendario y desglose discriminado por sucursal, exportable a XLSX o PDF imprimible.
          </p>
        </div>
      </div>
    </div>
  );
}
