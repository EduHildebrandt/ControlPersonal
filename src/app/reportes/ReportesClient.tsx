"use client";

import { useState, useTransition } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  User,
  Building2,
  Clock,
  Sparkles,
  FileText,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { MESES } from "@/lib/utils";
import { getReporteMensualEmpleado } from "@/actions/reportes";
import { exportarReporteExcel, exportarReportePDF } from "@/lib/export";
import { ResumenMensualEmpleado } from "@/lib/reports";

interface EmpleadoOption {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  rol: string;
}

export function ReportesClient({ empleados }: { empleados: EmpleadoOption[] }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [anio, setAnio] = useState<number>(currentYear);
  const [mes, setMes] = useState<number>(currentMonth);
  const [empleadoId, setEmpleadoId] = useState<string>(empleados[0]?.id || "");
  const [resumen, setResumen] = useState<ResumenMensualEmpleado | null>(null);
  const [empleadoInfo, setEmpleadoInfo] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportando, setExportando] = useState(false);

  const handleGenerarReporte = () => {
    if (!empleadoId) {
      setErrorMsg("Debes seleccionar un empleado.");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      const res = await getReporteMensualEmpleado(empleadoId, anio, mes);
      if (!res.success) {
        setErrorMsg(res.error || "No se pudo generar el reporte.");
        setResumen(null);
      } else {
        setResumen(res.data || null);
        setEmpleadoInfo(res.empleado || null);
      }
    });
  };

  const handleDescargarExcel = async () => {
    if (!resumen || !empleadoInfo) return;
    try {
      setExportando(true);
      const blob = await exportarReporteExcel(resumen, {
        nombreCompleto: empleadoInfo.nombreCompleto,
        dni: empleadoInfo.dni,
        rol: empleadoInfo.rol,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const mesNom = MESES.find((m) => m.id === mes)?.nombre || `Mes_${mes}`;
      a.download = `Reporte_${empleadoInfo.nombreCompleto.replace(/\s+/g, "_")}_${mesNom}_${anio}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      alert("Ocurrió un error al generar el archivo Excel.");
    } finally {
      setExportando(false);
    }
  };

  const handleDescargarPDF = () => {
    if (!resumen || !empleadoInfo) return;
    try {
      exportarReportePDF(resumen, {
        nombreCompleto: empleadoInfo.nombreCompleto,
        dni: empleadoInfo.dni,
        rol: empleadoInfo.rol,
      });
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      alert("Ocurrió un error al generar el PDF.");
    }
  };

  const mesActualNombre = MESES.find((m) => m.id === mes)?.nombre || `Mes ${mes}`;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Informes y Reportes Mensuales de Horas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consolidación automática de horas efectivas por empleado, discriminado por local con exportación a PDF y Excel.
          </p>
        </div>
      </div>

      {/* Panel de Filtros de Período */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filtros de Liquidación e Informe</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          {/* Selector Empleado */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seleccionar Colaborador *
            </label>
            <select
              value={empleadoId}
              onChange={(e) => setEmpleadoId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            >
              {empleados.length === 0 ? (
                <option value="">No hay empleados registrados</option>
              ) : (
                empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido} — DNI: {emp.dni} ({emp.rol})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Selector Mes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mes *</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            >
              {MESES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector Año & Botón */}
          <div className="flex gap-2">
            <div className="w-24">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Año *</label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                min={2020}
                max={2035}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
              />
            </div>

            <button
              onClick={handleGenerarReporte}
              disabled={isPending || !empleadoId}
              className="flex-1 mt-auto px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPending ? "Calculando..." : "Consultar"}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="mt-3 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Resultados del Reporte */}
      {resumen && empleadoInfo && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card Resumen de Cabecera con Botones de Exportar */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Informe Oficial de Horas
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {empleadoInfo.nombreCompleto}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                DNI: {empleadoInfo.dni} | Rol: {empleadoInfo.rol} | Período:{" "}
                <span className="font-semibold text-slate-700">
                  {mesActualNombre} {anio}
                </span>
              </p>
            </div>

            {/* Botones de Exportación */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDescargarExcel}
                disabled={exportando}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleDescargarPDF}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>

          {/* Tarjetas Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Horas Brutas Efectivas
              </span>
              <p className="text-3xl font-extrabold text-blue-600 mt-2">
                {resumen.totalHorasMes} <span className="text-lg font-medium text-slate-600">hrs</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Horas totales en el mes seleccionado</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Turnos Asignados
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {resumen.totalTurnosMes}
              </p>
              <p className="text-xs text-slate-500 mt-1">Ocurrencias computadas en el calendario</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Promedio Horas / Turno
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                {resumen.totalTurnosMes > 0
                  ? (resumen.totalHorasMes / resumen.totalTurnosMes).toFixed(1)
                  : "0"}{" "}
                <span className="text-lg font-medium text-slate-600">h/turno</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Intensidad media por jornada</p>
            </div>
          </div>

          {/* Desglose por Local */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Desglose de Horas Discriminado por Sucursal / Local
            </h3>

            {resumen.desglosePorLocal.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No registra horas en ningún local.</p>
            ) : (
              <div className="space-y-4">
                {resumen.desglosePorLocal.map((local) => {
                  const porcentaje =
                    resumen.totalHorasMes > 0
                      ? Math.round((local.totalHoras / resumen.totalHorasMes) * 100)
                      : 0;

                  return (
                    <div key={local.localId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800">
                          <span className="font-mono font-bold text-blue-600 mr-1.5">
                            [{local.codigo}]
                          </span>
                          {local.nombreLocal} ({local.turnosCount} turnos)
                        </span>
                        <span className="font-bold text-slate-900">
                          {local.totalHoras} hrs ({porcentaje}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historial Detallado de Turnos en el Mes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Historial Cronológico de Turnos Computados ({mesActualNombre} {anio})
              </h3>
            </div>

            {resumen.historialTurnos.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay turnos registrados en este período.
              </div>
            ) : (
              <div>
                {/* VISTA MÓVIL: Tarjetas de turnos computados */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {resumen.historialTurnos.map((t, idx) => (
                    <div key={idx} className="p-3.5 space-y-1.5 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900">
                          {t.fechaStr} ({t.diaNombre})
                        </span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {t.duracionHoras} hrs
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {t.localNombre}
                        </span>
                        <span className="font-mono font-medium text-slate-700">{t.horario}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VISTA ESCRITORIO Y TABLET: Tabla Completa */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Fecha</th>
                        <th className="px-5 py-3">Día</th>
                        <th className="px-5 py-3">Sucursal / Local</th>
                        <th className="px-5 py-3">Horario</th>
                        <th className="px-5 py-3 text-center">Tipo</th>
                        <th className="px-5 py-3 text-right">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resumen.historialTurnos.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3 font-mono font-medium text-slate-800">
                            {t.fechaStr}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{t.diaNombre}</td>
                          <td className="px-5 py-3 text-slate-600 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.localNombre}</span>
                          </td>
                          <td className="px-5 py-3 font-mono font-semibold text-slate-800">
                            {t.horario}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                t.tipo === "RECURRENTE"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {t.tipo}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-blue-700">
                            {t.duracionHoras} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State inicial */}
      {!resumen && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Consulta de Reportes Mensuales</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Selecciona el colaborador, mes y año en los filtros superiores y presiona "Consultar" para calcular las horas brutas efectivas y exportar el informe.
          </p>
        </div>
      )}
    </div>
  );
}
