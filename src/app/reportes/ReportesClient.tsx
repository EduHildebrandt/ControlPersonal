"use client";

import { useState, useTransition, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  Building2,
  Clock,
  Sparkles,
  FileText,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Palmtree,
  CreditCard,
  Briefcase,
} from "lucide-react";
import { getReporteLiquidacionHoras } from "@/actions/reportes";
import { exportarLiquidacionExcel, exportarLiquidacionPDF } from "@/lib/export";
import { ReporteLiquidacionGeneral, LiquidacionEmpleadoRango } from "@/lib/reports";

interface EmpleadoOption {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  rol: string;
}

export function ReportesClient({ empleados }: { empleados: EmpleadoOption[] }) {
  // Por defecto, período de liquidación del mes actual
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

  const [fechaDesde, setFechaDesde] = useState<string>(`${year}-${month}-01`);
  const [fechaHasta, setFechaHasta] = useState<string>(`${year}-${month}-${lastDay}`);
  const [empleadoId, setEmpleadoId] = useState<string>("ALL");

  const [reporte, setReporte] = useState<ReporteLiquidacionGeneral | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportando, setExportando] = useState(false);
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // Carga inicial automática al montar
  useEffect(() => {
    handleGenerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerar = () => {
    if (!fechaDesde || !fechaHasta) {
      setErrorMsg("Debes indicar fecha desde y fecha hasta.");
      return;
    }
    if (fechaHasta < fechaDesde) {
      setErrorMsg("La fecha hasta no puede ser menor a la fecha desde.");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      const res = await getReporteLiquidacionHoras(fechaDesde, fechaHasta, empleadoId);
      if (!res.success) {
        setErrorMsg(res.error || "Error al generar la liquidación.");
        setReporte(null);
      } else {
        setReporte(res.data || null);
      }
    });
  };

  const handleExportExcel = async () => {
    if (!reporte) return;
    try {
      setExportando(true);
      const blob = await exportarLiquidacionExcel(reporte);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Liquidacion_Horas_${reporte.fechaDesde}_al_${reporte.fechaHasta}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error al exportar a Excel.");
    } finally {
      setExportando(false);
    }
  };

  const handleExportPDF = () => {
    if (!reporte) return;
    try {
      setExportando(true);
      exportarLiquidacionPDF(reporte);
    } catch (e) {
      console.error(e);
      alert("Error al exportar a PDF.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Reporte (liquidacion de horas)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidación y cálculo oficial de horas trabajadas y vacaciones liquidadas por rango de fechas
          </p>
        </div>

        {reporte && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exportando}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exportando}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtros de Rango de Fechas y Colaborador */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Fecha Desde *
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Fecha Hasta *
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Colaborador
            </label>
            <select
              value={empleadoId}
              onChange={(e) => setEmpleadoId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="ALL">Todos los Colaboradores</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido} ({emp.rol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handleGenerar}
              disabled={isPending}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPending ? "Calculando..." : "Generar Liquidación"}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Resultados de Liquidación */}
      {reporte && (
        <div className="space-y-6">
          {/* Tarjetas KPI de Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 block">Horas Trabajadas (Turnos)</span>
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {reporte.totalHorasTrabajadasEmpresa} <span className="text-sm font-semibold text-slate-400">hs</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Palmtree className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 block">Vacaciones Liquidadas</span>
                <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                  {reporte.totalHorasVacacionesEmpresa} <span className="text-sm font-semibold text-emerald-600">hs</span>
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-blue-100 block">TOTAL A LIQUIDAR</span>
                <span className="text-2xl font-black tracking-tight">
                  {reporte.totalGeneralHorasLiquidar} <span className="text-sm font-semibold text-blue-200">hs</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tabla Desglosada por Colaborador */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Desglose de Liquidación de Horas
                </h3>
                <p className="text-xs text-slate-500">
                  Período del {reporte.fechaDesde} al {reporte.fechaHasta} ({reporte.empleados.length} colaboradores)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Colaborador</th>
                    <th className="px-6 py-3.5 font-semibold">Rol</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Hs Trabajadas</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Días Vac. Liq.</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Hs Vacaciones</th>
                    <th className="px-6 py-3.5 font-semibold text-right">TOTAL HORAS</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporte.empleados.map((emp) => {
                    const isExpanded = expandedEmpId === emp.empleadoId;
                    return (
                      <React.Fragment key={emp.empleadoId}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900 block">{emp.nombreCompleto}</span>
                            <span className="text-xs text-slate-400 font-mono">DNI: {emp.dni}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                              {emp.rol}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-slate-800">
                            {emp.horasTrabajadas}h
                          </td>
                          <td className="px-6 py-4 text-center">
                            {emp.diasVacacionesLiquidados > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {emp.diasVacacionesLiquidados} d
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold text-emerald-700">
                            {emp.horasVacacionesLiquidadas > 0 ? `${emp.horasVacacionesLiquidadas}h` : "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-base font-extrabold text-blue-900">
                            {emp.totalHorasALiquidar}h
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setExpandedEmpId(isExpanded ? null : emp.empleadoId)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Ver detalle de turnos y vacaciones"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Desglose Expandible */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Desglose por local */}
                                <div className="p-3 bg-white rounded-xl border border-slate-200">
                                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                    Horas por Local / Sucursal
                                  </h4>
                                  {emp.desgloseLocales.length === 0 ? (
                                    <p className="text-slate-400 italic">Sin turnos en este período</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {emp.desgloseLocales.map((loc) => (
                                        <div key={loc.localNombre} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                          <span className="text-slate-600">{loc.localNombre}</span>
                                          <span className="font-mono font-bold text-slate-800">{loc.horas} hrs</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Desglose vacaciones liquidadas */}
                                <div className="p-3 bg-white rounded-xl border border-slate-200">
                                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                    <Palmtree className="w-3.5 h-3.5 text-emerald-600" />
                                    Vacaciones Liquidadas (Compensadas)
                                  </h4>
                                  {emp.detalleVacaciones.length === 0 ? (
                                    <p className="text-slate-400 italic">No registra liquidaciones de vacaciones en este período</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {emp.detalleVacaciones.map((vac, vIdx) => (
                                        <div key={vIdx} className="p-2 rounded bg-emerald-50/50 border border-emerald-100 flex justify-between items-center">
                                          <div>
                                            <span className="font-medium text-emerald-900 block">{vac.fechaStr} ({vac.dias} días)</span>
                                            <span className="text-[11px] text-slate-500">{vac.observaciones}</span>
                                          </div>
                                          <span className="font-mono font-bold text-emerald-700 text-sm">+{vac.horas} hrs</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
