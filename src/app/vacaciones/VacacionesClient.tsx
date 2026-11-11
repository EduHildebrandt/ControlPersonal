"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Palmtree,
  Calendar,
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Search,
  X,
  Filter,
  CalendarRange,
  Sun,
  ShieldAlert,
  Coins,
} from "lucide-react";
import { MESES, DIAS_SEMANA } from "@/lib/utils";
import {
  ResumenVacacionEmpleado,
  guardarVacacion,
  eliminarVacacion,
  liquidarVacaciones,
  getVacacionesCalendario,
} from "@/actions/vacaciones";

interface VacacionCalendarioItem {
  id: string;
  empleadoId: string;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  diasTomados: number;
  observaciones: string | null;
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    rol: string;
    activo: boolean;
  };
}

export function VacacionesClient({
  initialResumen,
  initialVacacionesMes,
  initialMes,
  initialAnio,
}: {
  initialResumen: ResumenVacacionEmpleado[];
  initialVacacionesMes: VacacionCalendarioItem[];
  initialMes: number;
  initialAnio: number;
}) {
  const [activeTab, setActiveTab] = useState<"CALENDARIO" | "SALDOS">("CALENDARIO");
  const [resumen, setResumen] = useState<ResumenVacacionEmpleado[]>(initialResumen);
  const [vacacionesMes, setVacacionesMes] = useState<VacacionCalendarioItem[]>(initialVacacionesMes);
  const [mes, setMes] = useState<number>(initialMes);
  const [anio, setAnio] = useState<number>(initialAnio);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEmpleadoId, setFiltroEmpleadoId] = useState<string>("ALL");

  // Modal registrar vacaciones
  const [modalOpen, setModalOpen] = useState(false);
  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState<string>(
    initialResumen[0]?.empleadoId || ""
  );
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal confirmar eliminación
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Modal Liquidar Vacaciones no gozadas
  const [liquidarModalOpen, setLiquidarModalOpen] = useState(false);
  const [liquidarEmpleadoId, setLiquidarEmpleadoId] = useState<string>(
    initialResumen[0]?.empleadoId || ""
  );
  const [liquidarDias, setLiquidarDias] = useState<number>(1);
  const [liquidarHoras, setLiquidarHoras] = useState<number>(8);
  const [liquidarFecha, setLiquidarFecha] = useState<string>(new Date().toISOString().substring(0, 10));
  const [liquidarNotas, setLiquidarNotas] = useState("");
  const [liquidarErrorMsg, setLiquidarErrorMsg] = useState<string | null>(null);

  const empleadoLiquidar = resumen.find((e) => e.empleadoId === liquidarEmpleadoId);

  const [isPending, startTransition] = useTransition();

  // Calcular días seleccionados en vivo
  const diasCalculados = useMemo(() => {
    if (!fechaInicio || !fechaFin) return 0;
    const start = new Date(fechaInicio + "T00:00:00Z");
    const end = new Date(fechaFin + "T00:00:00Z");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [fechaInicio, fechaFin]);

  const empleadoSeleccionado = resumen.find((e) => e.empleadoId === empleadoSeleccionadoId);

  // Navegación de mes en el calendario
  const cambiarMes = (delta: number) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;

    if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnio -= 1;
    } else if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio += 1;
    }

    setMes(nuevoMes);
    setAnio(nuevoAnio);

    startTransition(async () => {
      const res = await getVacacionesCalendario(nuevoMes, nuevoAnio);
      if (res.success) {
        setVacacionesMes((res.data as any[]) || []);
      }
    });
  };

  // Guardar Vacación
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await guardarVacacion({
        empleadoId: empleadoSeleccionadoId,
        fechaInicio,
        fechaFin,
        observaciones,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Error al registrar la solicitud.");
      } else {
        setModalOpen(false);
        setFechaInicio("");
        setFechaFin("");
        setObservaciones("");
        window.location.reload();
      }
    });
  };

  // Eliminar Vacación
  const handleEliminar = (id: string) => {
    startTransition(async () => {
      const res = await eliminarVacacion(id);
      if (res.success) {
        setConfirmDeleteId(null);
        window.location.reload();
      } else {
        alert(res.error || "No se pudo cancelar el período de vacaciones.");
      }
    });
  };

  // Liquidar Vacaciones No Gozadas
  const handleLiquidarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLiquidarErrorMsg(null);

    startTransition(async () => {
      const res = await liquidarVacaciones({
        empleadoId: liquidarEmpleadoId,
        diasALiquidar: Number(liquidarDias),
        horasEquivalentes: Number(liquidarHoras),
        fecha: liquidarFecha,
        observaciones: liquidarNotas,
      });

      if (!res.success) {
        setLiquidarErrorMsg(res.error || "Error al liquidar vacaciones.");
      } else {
        setLiquidarModalOpen(false);
        window.location.reload();
      }
    });
  };

  // Métricas generales
  const totalEmpleados = resumen.length;
  const totalDiasAsignados = resumen.reduce((acc, curr) => acc + curr.diasVacacionesTotales, 0);
  const totalDiasTomados = resumen.reduce((acc, curr) => acc + curr.diasTomados, 0);
  const empleadosEnVacacionesMes = useMemo(() => {
    const ids = new Set(vacacionesMes.map((v) => v.empleadoId));
    return ids.size;
  }, [vacacionesMes]);

  // Generador de la cuadrícula de días para el mes actual
  const diasCalendario = useMemo(() => {
    // Primer día del mes
    const primerDia = new Date(Date.UTC(anio, mes - 1, 1));
    const ultimoDia = new Date(Date.UTC(anio, mes, 0));
    const totalDias = ultimoDia.getUTCDate();

    // getUTCDay: 0=Domingo, 1=Lunes, ..., 6=Sábado
    const dayOfWeek = primerDia.getUTCDay();
    // Normalizar a 0=Lunes, 6=Domingo
    const offsetInicio = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const celdas: Array<{
      diaNumero: number | null;
      fechaIso: string | null;
      vacaciones: VacacionCalendarioItem[];
    }> = [];

    // Celdas vacías antes del día 1
    for (let i = 0; i < offsetInicio; i++) {
      celdas.push({ diaNumero: null, fechaIso: null, vacaciones: [] });
    }

    // Días del mes
    for (let d = 1; d <= totalDias; d++) {
      const fIso = `${anio}-${mes.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      const fechaComparar = new Date(Date.UTC(anio, mes - 1, d, 12, 0, 0));

      const vacsDelDia = vacacionesMes.filter((v) => {
        if (filtroEmpleadoId !== "ALL" && v.empleadoId !== filtroEmpleadoId) return false;
        const vStart = new Date(v.fechaInicio);
        const vEnd = new Date(v.fechaFin);
        // Comparación de fechas normalizada
        const vStartDay = new Date(Date.UTC(vStart.getUTCFullYear(), vStart.getUTCMonth(), vStart.getUTCDate(), 0, 0, 0));
        const vEndDay = new Date(Date.UTC(vEnd.getUTCFullYear(), vEnd.getUTCMonth(), vEnd.getUTCDate(), 23, 59, 59));
        return fechaComparar >= vStartDay && fechaComparar <= vEndDay;
      });

      celdas.push({
        diaNumero: d,
        fechaIso: fIso,
        vacaciones: vacsDelDia,
      });
    }

    return celdas;
  }, [mes, anio, vacacionesMes, filtroEmpleadoId]);

  const mesNombre = MESES.find((m) => m.id === mes)?.nombre || `Mes ${mes}`;

  const resumenFiltrado = resumen.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(q) ||
      r.apellido.toLowerCase().includes(q) ||
      r.dni.toLowerCase().includes(q) ||
      r.rol.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabecera principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Palmtree className="w-6 h-6 text-emerald-600" />
            Módulo de Control y Registro de Vacaciones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra los días asignados, contabiliza períodos de descanso y visualiza el cronograma en calendario interactivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setLiquidarErrorMsg(null);
              setLiquidarDias(1);
              setLiquidarHoras(8);
              setLiquidarNotas("");
              setLiquidarModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-xs sm:text-sm hover:bg-amber-700 transition shadow-sm"
          >
            <Coins className="w-4 h-4" />
            <span>Liquidar Vacaciones (Pagar Horas)</span>
          </button>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-xs sm:text-sm hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Vacaciones</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Colaboradores
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalEmpleados}</p>
            <span className="text-[11px] text-slate-500">Con cupo vacacional asignado</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En Vacaciones ({mesNombre})
            </span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{empleadosEnVacacionesMes}</p>
            <span className="text-[11px] text-slate-500">Colaboradores con días en el mes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Días Totales Tomados
            </span>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalDiasTomados} d</p>
            <span className="text-[11px] text-slate-500">Computados en períodos activos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarRange className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Días Totales Disponibles
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {Math.max(0, totalDiasAsignados - totalDiasTomados)} d
            </p>
            <span className="text-[11px] text-slate-500">De {totalDiasAsignados} días asignados</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Palmtree className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("CALENDARIO")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === "CALENDARIO"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendario Mensual de Vacaciones</span>
        </button>

        <button
          onClick={() => setActiveTab("SALDOS")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === "SALDOS"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Control de Saldos por Colaborador</span>
        </button>
      </div>

      {/* PESTAÑA 1: CALENDARIO MENSUAL */}
      {activeTab === "CALENDARIO" && (
        <div className="space-y-4">
          {/* Barra de control del calendario */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarMes(-1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 min-w-[170px] text-center capitalize">
                {mesNombre} {anio}
              </h2>

              <button
                onClick={() => cambiarMes(1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filtro por empleado */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={filtroEmpleadoId}
                onChange={(e) => setFiltroEmpleadoId(e.target.value)}
                className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Todos los colaboradores</option>
                {resumen.map((r) => (
                  <option key={r.empleadoId} value={r.empleadoId}>
                    {r.nombre} {r.apellido} ({r.rol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cuadrícula de Calendario */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} className="py-2.5 border-r border-slate-100 last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas de días */}
            <div className="grid grid-cols-7 auto-rows-fr divide-y divide-slate-100">
              {diasCalendario.map((celda, idx) => {
                if (celda.diaNumero === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="bg-slate-50/50 min-h-[90px] sm:min-h-[110px] border-r border-slate-100 last:border-r-0"
                    />
                  );
                }

                const hayVacaciones = celda.vacaciones.length > 0;

                return (
                  <div
                    key={celda.fechaIso}
                    className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 border-r border-slate-100 last:border-r-0 transition-colors flex flex-col justify-between ${
                      hayVacaciones ? "bg-emerald-50/30" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          hayVacaciones
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-700"
                        }`}
                      >
                        {celda.diaNumero}
                      </span>

                      {hayVacaciones && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
                          {celda.vacaciones.length} {celda.vacaciones.length === 1 ? "vac." : "vacs."}
                        </span>
                      )}
                    </div>

                    {/* Lista de colaboradores de vacaciones en este día */}
                    <div className="space-y-1 mt-1 overflow-y-auto max-h-[70px] scrollbar-none">
                      {celda.vacaciones.map((v) => (
                        <div
                          key={v.id}
                          className="p-1 rounded bg-white border border-emerald-200 shadow-2xs text-[10px] leading-tight"
                          title={`${v.empleado.nombre} ${v.empleado.apellido} (${v.empleado.rol}) - ${v.diasTomados} días. ${v.observaciones || ""}`}
                        >
                          <p className="font-semibold text-slate-900 truncate">
                            {v.empleado.nombre} {v.empleado.apellido}
                          </p>
                          <span className="text-[9px] text-emerald-700 font-medium">
                            {v.empleado.rol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONTROL DE SALDOS Y LISTADO */}
      {activeTab === "SALDOS" && (
        <div className="space-y-4">
          {/* Barra de Búsqueda */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Buscar colaborador por nombre, apellido, DNI o cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-slate-600 px-2"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* VISTA MÓVIL: Tarjetas de Vacaciones */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {resumenFiltrado.map((emp) => {
              const porcentaje =
                emp.diasVacacionesTotales > 0
                  ? Math.min(100, Math.round((emp.diasTomados / emp.diasVacacionesTotales) * 100))
                  : 0;

              return (
                <div
                  key={emp.empleadoId}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {emp.nombre} {emp.apellido}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {emp.rol}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          DNI: {emp.dni}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        emp.diasRestantes > 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {emp.diasRestantes} días disp.
                    </span>
                  </div>

                  {/* Barra de progreso de días */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Consumo de vacaciones:</span>
                      <span className="font-semibold text-slate-900">
                        {emp.diasTomados} / {emp.diasVacacionesTotales} días ({porcentaje}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>

                  {/* Períodos de vacaciones tomadas */}
                  {emp.vacaciones.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Períodos Registrados:
                      </span>
                      {emp.vacaciones.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div>
                            <span className="font-mono font-semibold text-slate-800">
                              {new Date(v.fechaInicio).toLocaleDateString("es-ES")} -{" "}
                              {new Date(v.fechaFin).toLocaleDateString("es-ES")}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {v.diasTomados} {v.diasTomados === 1 ? "día" : "días"}
                              {v.observaciones ? ` • ${v.observaciones}` : ""}
                            </span>
                          </div>
                          <button
                            onClick={() => setConfirmDeleteId(v.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded"
                            title="Cancelar vacaciones"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setEmpleadoSeleccionadoId(emp.empleadoId);
                      setModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Asignar Período de Vacaciones</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* VISTA ESCRITORIO: Tabla Completa */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Colaborador</th>
                  <th className="px-6 py-3.5 font-semibold">Rol</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Días Asignados</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Días Tomados</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Saldo Restante</th>
                  <th className="px-6 py-3.5 font-semibold">Historial de Períodos</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumenFiltrado.map((emp) => {
                  const porcentaje =
                    emp.diasVacacionesTotales > 0
                      ? Math.min(100, Math.round((emp.diasTomados / emp.diasVacacionesTotales) * 100))
                      : 0;

                  return (
                    <tr key={emp.empleadoId} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {emp.nombre} {emp.apellido}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">DNI: {emp.dni}</div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                          {emp.rol}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {emp.diasVacacionesTotales} d
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-indigo-700">
                        {emp.diasTomados} d
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            emp.diasRestantes > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          <Palmtree className="w-3.5 h-3.5 text-emerald-600" />
                          {emp.diasRestantes} días
                        </span>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5 mx-auto">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {emp.vacaciones.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Sin vacaciones registradas</span>
                        ) : (
                          <div className="space-y-1 max-w-xs">
                            {emp.vacaciones.map((v) => (
                              <div
                                key={v.id}
                                className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50 border border-slate-200"
                              >
                                <span className="font-mono text-slate-700 text-[11px]">
                                  {new Date(v.fechaInicio).toLocaleDateString("es-ES")} -{" "}
                                  {new Date(v.fechaFin).toLocaleDateString("es-ES")} ({v.diasTomados}d)
                                </span>
                                <button
                                  onClick={() => setConfirmDeleteId(v.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                  title="Cancelar estas vacaciones"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEmpleadoSeleccionadoId(emp.empleadoId);
                            setModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Asignar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR VACACIONES */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-emerald-600" />
                Registrar Período de Vacaciones
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Selector de Empleado */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Colaborador *
                </label>
                <select
                  value={empleadoSeleccionadoId}
                  onChange={(e) => setEmpleadoSeleccionadoId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {resumen.map((emp) => (
                    <option key={emp.empleadoId} value={emp.empleadoId}>
                      {emp.nombre} {emp.apellido} — DNI: {emp.dni} ({emp.diasRestantes} días disp.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Saldo actual del empleado seleccionado */}
              {empleadoSeleccionado && (
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex justify-between">
                    <span>Días anuales asignados:</span>
                    <strong className="font-bold">{empleadoSeleccionado.diasVacacionesTotales} días</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Días ya consumidos:</span>
                    <strong className="font-bold text-indigo-700">{empleadoSeleccionado.diasTomados} días</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-200/60 text-emerald-800">
                    <span>Saldo disponible:</span>
                    <strong className="font-extrabold">{empleadoSeleccionado.diasRestantes} días disponibles</strong>
                  </div>
                </div>
              )}

              {/* Rango de Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Desde *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Hasta *
                  </label>
                  <input
                    type="date"
                    required
                    min={fechaInicio}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Cálculo en vivo de días solicitados */}
              {diasCalculados > 0 && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                  <span>Días de vacaciones computados:</span>
                  <span className="font-bold text-sm text-blue-700">{diasCalculados} días</span>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Motivo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Vacaciones anuales reglamentarias"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || diasCalculados === 0}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {isPending ? "Procesando..." : "Confirmar Vacaciones"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LIQUIDAR VACACIONES (PAGAR HORAS) */}
      {liquidarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                Liquidar Vacaciones No Gozadas
              </h3>
              <button
                onClick={() => setLiquidarModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLiquidarSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {liquidarErrorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{liquidarErrorMsg}</span>
                </div>
              )}

              {/* Colaborador */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Colaborador a Liquidar *
                </label>
                <select
                  value={liquidarEmpleadoId}
                  onChange={(e) => setLiquidarEmpleadoId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                >
                  {resumen.map((emp) => (
                    <option key={emp.empleadoId} value={emp.empleadoId}>
                      {emp.nombre} {emp.apellido} (Saldo: {emp.diasRestantes} días disponibles)
                    </option>
                  ))}
                </select>
              </div>

              {empleadoLiquidar && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex justify-between">
                    <span>Cupo total anual:</span>
                    <strong>{empleadoLiquidar.diasVacacionesTotales} días</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Días ya tomados / liquidados:</span>
                    <span>{empleadoLiquidar.diasTomados} días</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-amber-200 text-amber-900 font-bold">
                    <span>Saldo disponible para liquidar:</span>
                    <span>{empleadoLiquidar.diasRestantes} días</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Días a liquidar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Días a Liquidar *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={empleadoLiquidar ? empleadoLiquidar.diasRestantes : 60}
                    required
                    value={liquidarDias}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setLiquidarDias(d);
                      // Sugerir 8hs por día automáticamente
                      setLiquidarHoras(d * 8);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Se descontarán de su saldo</span>
                </div>

                {/* Horas equivalentes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Equivalente en Horas a Pagar *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    required
                    value={liquidarHoras}
                    onChange={(e) => setLiquidarHoras(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-700"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Horas que sumarán al reporte</span>
                </div>
              </div>

              {/* Fecha de Liquidación */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Liquidación *
                </label>
                <input
                  type="date"
                  required
                  value={liquidarFecha}
                  onChange={(e) => setLiquidarFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Liquidación solicitada por el empleado"
                  value={liquidarNotas}
                  onChange={(e) => setLiquidarNotas(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLiquidarModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !empleadoLiquidar || empleadoLiquidar.diasRestantes <= 0 || liquidarDias > empleadoLiquidar.diasRestantes}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Procesando..." : "Confirmar Liquidación de Horas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR CANCELACIÓN DE VACACIONES */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cancelar Vacaciones</h3>
                <p className="text-xs text-slate-500">¿Confirmas revocar este período de vacaciones?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Los días serán devueltos inmediatamente al saldo disponible del colaborador.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => handleEliminar(confirmDeleteId)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isPending ? "Cancelando..." : "Sí, Cancelar Vacaciones"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
