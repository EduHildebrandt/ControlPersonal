"use client";

import { useState, useTransition, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Trash2,
  Moon,
  Clock,
  Building2,
  User,
  AlertTriangle,
  X,
  Filter,
  CheckCircle2,
  Sparkles,
  Printer,
  Calendar as CalendarIcon,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Palmtree,
  ShieldAlert,
} from "lucide-react";
import { formatHoras } from "@/lib/utils";
import { calcularDuracionHoras } from "@/lib/shifts";
import { guardarTurno, eliminarTurno } from "@/actions/turnos";

interface TurnoItem {
  id: string;
  empleadoId: string;
  localId: string;
  tipo: "RECURRENTE" | "PUNTUAL";
  diaSemana: number | null;
  fecha: string | null;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  duracionHoras: number;
  notas: string | null;
  activo: boolean;
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    rol: string;
    tieneCarnetManipulacion?: boolean;
    vencimientoCarnetManipulacion?: any;
    vacaciones?: Array<{
      id: string;
      tipo?: string;
      fechaInicio: any;
      fechaFin: any;
      diasTomados: number;
    }>;
  };
  local: {
    id: string;
    nombreLocal: string;
    codigo: string;
  };
}

interface LocalOption {
  id: string;
  codigo: string;
  nombreLocal: string;
}

interface EmpleadoOption {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  rol: string;
  tieneCarnetManipulacion?: boolean;
  vencimientoCarnetManipulacion?: any;
  vacaciones?: Array<{
    id: string;
    tipo?: string;
    fechaInicio: any;
    fechaFin: any;
    diasTomados: number;
  }>;
  locales: Array<{ localId: string }>;
}

// Cálculo estándar de semana ISO (1 a 52)
function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Obtener los 7 días de una semana (Lunes a Domingo)
function getDaysOfWeek(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);

  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);

  const days = [];
  const nombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const cortos = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setUTCDate(monday.getUTCDate() + i);
    const yyyy = cur.getUTCFullYear();
    const mm = (cur.getUTCMonth() + 1).toString().padStart(2, "0");
    const dd = cur.getUTCDate().toString().padStart(2, "0");
    const fechaStr = `${yyyy}-${mm}-${dd}`;
    days.push({
      diaId: i + 1, // 1=Lunes ... 7=Domingo
      nombre: nombres[i],
      corto: cortos[i],
      fechaStr,
      displayDate: `${dd}/${mm}`,
      fullDateStr: `${dd}/${mm}/${yyyy}`,
      dateObj: cur,
    });
  }
  return days;
}

export function TurnosClient({
  initialTurnos,
  locales,
  empleados,
}: {
  initialTurnos: TurnoItem[];
  locales: LocalOption[];
  empleados: EmpleadoOption[];
}) {
  const [turnos, setTurnos] = useState<TurnoItem[]>(initialTurnos);
  const [filtroLocal, setFiltroLocal] = useState<string>("ALL");
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>("ALL");

  // Navegación Semanal (1 a 52)
  // Por defecto semana 45 (Noviembre 2026) o la semana actual
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentWeek = getISOWeek(today);

  const [anio, setAnio] = useState<number>(2026);
  // Si estamos en 2026 arrancamos en semana 45 donde están los turnos cargados
  const [semana, setSemana] = useState<number>(45);

  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selector móvil de día
  const [diaMovilSeleccionado, setDiaMovilSeleccionado] = useState<number | "ALL">("ALL");

  // Edición de turno
  const [editingTurnoId, setEditingTurnoId] = useState<string | null>(null);

  // Form states
  const [empleadoId, setEmpleadoId] = useState(empleados[0]?.id || "");
  const [localId, setLocalId] = useState(locales[0]?.id || "");
  const [tipo, setTipo] = useState<"RECURRENTE" | "PUNTUAL">("PUNTUAL");
  const [diaSemana, setDiaSemana] = useState<number>(1);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().substring(0, 10));
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("16:00");
  const [notas, setNotas] = useState("");

  // Días de la semana seleccionada (Lunes a Domingo)
  const diasSemana = useMemo(() => {
    return getDaysOfWeek(anio, semana);
  }, [anio, semana]);

  const primerDiaSemana = diasSemana[0];
  const ultimoDiaSemana = diasSemana[6];

  // Helper: Comprobar si un empleado está de vacaciones en una fecha
  const getVacacionDeEmpleado = (empId: string, fechaStr: string) => {
    const emp = empleados.find((e) => e.id === empId);
    if (!emp?.vacaciones || emp.vacaciones.length === 0) return null;

    const fTarget = new Date(fechaStr + "T00:00:00Z");
    for (const v of emp.vacaciones) {
      if (v.tipo && v.tipo !== "GOZADA") continue;
      const s = new Date(v.fechaInicio);
      const e = new Date(v.fechaFin);
      if (fTarget >= s && fTarget <= e) {
        return v;
      }
    }
    return null;
  };

  // Helper: Alerta de carnet de manipulación
  const getCarnetAlerta = (emp: any) => {
    if (!emp?.tieneCarnetManipulacion || !emp?.vencimientoCarnetManipulacion) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(emp.vencimientoCarnetManipulacion);
    venc.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded shadow-xs animate-pulse">
          <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
          Carnet Vencido
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded shadow-xs">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
          Carnet vence {diffDays}d
        </span>
      );
    }
    return null;
  };

  // Filtrado de turnos
  const turnosFiltrados = useMemo(() => {
    return turnos.filter((t) => {
      if (filtroLocal !== "ALL" && t.localId !== filtroLocal) return false;
      if (filtroEmpleado !== "ALL" && t.empleadoId !== filtroEmpleado) return false;
      return true;
    });
  }, [turnos, filtroLocal, filtroEmpleado]);

  // Duración calculada en vivo
  const calculoEnVivo = useMemo(() => {
    return calcularDuracionHoras(horaInicio, horaFin);
  }, [horaInicio, horaFin]);

  // Chequeo de vacaciones en el modal en tiempo real
  const conflictoVacacionesModal = useMemo(() => {
    if (tipo === "PUNTUAL" && fecha && empleadoId) {
      const v = getVacacionDeEmpleado(empleadoId, fecha);
      if (v) {
        const emp = empleados.find((e) => e.id === empleadoId);
        const sStr = new Date(v.fechaInicio).toLocaleDateString("es-AR", { timeZone: "UTC" });
        const eStr = new Date(v.fechaFin).toLocaleDateString("es-AR", { timeZone: "UTC" });
        return `${emp?.nombre} ${emp?.apellido} está de vacaciones del ${sStr} al ${eStr}.`;
      }
    }
    return null;
  }, [tipo, fecha, empleadoId, empleados]);

  const openModal = (defaultDiaId?: number, defaultFechaStr?: string, turnoToEdit?: TurnoItem) => {
    setErrorMsg(null);
    if (turnoToEdit) {
      setEditingTurnoId(turnoToEdit.id);
      setEmpleadoId(turnoToEdit.empleadoId);
      setLocalId(turnoToEdit.localId);
      setTipo(turnoToEdit.tipo);
      setDiaSemana(turnoToEdit.diaSemana || 1);
      setFecha(
        turnoToEdit.fecha
          ? new Date(turnoToEdit.fecha).toISOString().substring(0, 10)
          : defaultFechaStr || new Date().toISOString().substring(0, 10)
      );
      setHoraInicio(turnoToEdit.horaInicio);
      setHoraFin(turnoToEdit.horaFin);
      setNotas(turnoToEdit.notas || "");
    } else {
      setEditingTurnoId(null);
      if (defaultFechaStr) {
        setFecha(defaultFechaStr);
        setTipo("PUNTUAL");
      }
      if (defaultDiaId) {
        setDiaSemana(defaultDiaId);
      }
      setEmpleadoId(empleados[0]?.id || "");
      setLocalId(locales[0]?.id || "");
      setHoraInicio("08:00");
      setHoraFin("16:00");
      setNotas("");
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTurnoId(null);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (conflictoVacacionesModal) {
      setErrorMsg(`No es posible asignar el turno: ${conflictoVacacionesModal}`);
      return;
    }

    startTransition(async () => {
      const res = await guardarTurno({
        id: editingTurnoId || undefined,
        empleadoId,
        localId,
        tipo,
        diaSemana,
        fecha: tipo === "PUNTUAL" ? fecha : undefined,
        horaInicio,
        horaFin,
        notas,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Error al guardar el turno.");
      } else {
        closeModal();
        window.location.reload();
      }
    });
  };

  const handleEliminarTurno = (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este turno?")) return;
    startTransition(async () => {
      const res = await eliminarTurno(id);
      if (res.success) {
        setTurnos((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert(res.error || "Error al eliminar turno.");
      }
    });
  };

  // Navegación de semana
  const irSemanaAnterior = () => {
    if (semana > 1) {
      setSemana(semana - 1);
    } else {
      setSemana(52);
      setAnio(anio - 1);
    }
  };

  const irSemanaSiguiente = () => {
    if (semana < 52) {
      setSemana(semana + 1);
    } else {
      setSemana(1);
      setAnio(anio + 1);
    }
  };

  const irSemanaActual = () => {
    setAnio(currentYear);
    setSemana(currentWeek);
  };

  // Días a mostrar en móvil
  const diasAMostrar =
    diaMovilSeleccionado === "ALL"
      ? diasSemana
      : diasSemana.filter((d) => d.diaId === diaMovilSeleccionado);

  const handleImprimirGrilla = () => {
    window.print();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Printable Header */}
      <div className="print-only-header pb-4 mb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              SISTEMA DE CONTROL DE PERSONAL - PROGRAMACIÓN SEMANAL DE TURNOS (24/7)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Semana {semana} ({primerDiaSemana.fullDateStr} al {ultimoDiaSemana.fullDateStr}) | Puntos y Moda
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Fecha de emisión: {new Date().toLocaleDateString("es-AR")}</p>
            <p className="font-semibold text-slate-700">TurnoMaster Pro</p>
          </div>
        </div>
      </div>

      {/* Screen Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            Calendario Semanal de Turnos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Vista semana a semana (Lunes a Domingo) con nombres de colaboradores claros, control de carnet y vacaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleImprimirGrilla}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition shadow-sm"
            title="Imprimir grilla o guardar como PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={() => openModal()}
            disabled={empleados.length === 0 || locales.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Asignar Turno</span>
          </button>
        </div>
      </div>

      {/* BARRA SELECTORA DE SEMANA DEL AÑO (1 a 52) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={irSemanaAnterior}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-semibold"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={semana}
              onChange={(e) => setSemana(Number(e.target.value))}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-blue-300 bg-blue-50/50 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((wNum) => {
                const wDays = getDaysOfWeek(anio, wNum);
                return (
                  <option key={wNum} value={wNum}>
                    Semana {wNum} ({wDays[0].displayDate} al {wDays[6].displayDate})
                  </option>
                );
              })}
            </select>

            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="px-2.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            onClick={irSemanaSiguiente}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-semibold"
            title="Semana siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {primerDiaSemana.fullDateStr} al {ultimoDiaSemana.fullDateStr}
            </span>
          </div>

          <button
            onClick={irSemanaActual}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1"
          >
            Semana Actual
          </button>
        </div>
      </div>

      {/* Bar Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 text-xs no-print">
        <div className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtros:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {/* Local Filter */}
          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium shrink-0">Local:</label>
            <select
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Todos los locales</option>
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombreLocal} ({l.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Empleado Filter */}
          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium shrink-0">Personal:</label>
            <select
              value={filtroEmpleado}
              onChange={(e) => setFiltroEmpleado(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Todos los colaboradores</option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.apellido} ({e.rol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(filtroLocal !== "ALL" || filtroEmpleado !== "ALL") && (
          <button
            onClick={() => {
              setFiltroLocal("ALL");
              setFiltroEmpleado("ALL");
            }}
            className="text-blue-600 hover:underline font-medium text-xs self-end sm:self-center"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* SELECTOR MÓVIL DE DÍA */}
      <div className="lg:hidden no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setDiaMovilSeleccionado("ALL")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition ${
              diaMovilSeleccionado === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Todos los días
          </button>
          {diasSemana.map((dia) => (
            <button
              key={dia.diaId}
              onClick={() => setDiaMovilSeleccionado(dia.diaId)}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition ${
                diaMovilSeleccionado === dia.diaId
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {dia.corto} {dia.displayDate}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDARIO SEMANAL: 7 COLUMNAS (Lunes a Domingo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 print-grid-7">
        {diasAMostrar.map((dia) => {
          // Filtrar turnos correspondientes a este día calendario específico
          const turnosDelDia = turnosFiltrados.filter((t) => {
            if (t.tipo === "PUNTUAL" && t.fecha) {
              const tFechaStr =
                typeof t.fecha === "string"
                  ? t.fecha.substring(0, 10)
                  : new Date(t.fecha).toISOString().substring(0, 10);
              return tFechaStr === dia.fechaStr;
            }
            if (t.tipo === "RECURRENTE") {
              return t.diaSemana === dia.diaId;
            }
            return false;
          });

          const totalHorasDia = turnosDelDia.reduce((acc, curr) => acc + curr.duracionHoras, 0);

          // Colaboradores de vacaciones en esta fecha
          const empleadosDeVacacionesHoy = empleados.filter((emp) =>
            getVacacionDeEmpleado(emp.id, dia.fechaStr)
          );

          return (
            <div
              key={dia.diaId}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px] lg:min-h-[440px] overflow-hidden print-card"
            >
              {/* Day Header */}
              <div className="p-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                    <span>{dia.nombre}</span>
                    <span className="text-xs font-semibold text-blue-600">{dia.displayDate}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {turnosDelDia.length} {turnosDelDia.length === 1 ? "turno" : "turnos"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-800 block">
                    {formatHoras(totalHorasDia)}
                  </span>
                  <button
                    onClick={() => openModal(dia.diaId, dia.fechaStr)}
                    className="p-1 hover:bg-slate-200/70 text-slate-600 rounded-md transition mt-0.5 no-print"
                    title={`Agregar turno para ${dia.nombre} ${dia.displayDate}`}
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                </div>
              </div>

              {/* Day Shifts */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[550px]">
                {turnosDelDia.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                    <Clock className="w-6 h-6 mb-1 opacity-30 no-print" />
                    <span className="text-xs italic">Sin turnos asignados</span>
                  </div>
                ) : (
                  turnosDelDia.map((turno) => {
                    const carnetAlerta = getCarnetAlerta(turno.empleado);
                    const localColorClass =
                      turno.local.codigo === "MARMAU"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : turno.local.codigo === "MODASHOP"
                        ? "bg-pink-50 text-pink-700 border-pink-200"
                        : turno.local.codigo === "PUNTO-1"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : turno.local.codigo === "PUNTO-2"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-purple-50 text-purple-700 border-purple-200";

                    return (
                      <div
                        key={turno.id}
                        className={`p-2.5 rounded-xl border text-xs relative group transition-all shadow-2xs ${
                          turno.cruzaMedianoche
                            ? "bg-indigo-50/60 border-indigo-200"
                            : "bg-white border-slate-200/90 hover:border-blue-300"
                        }`}
                      >
                        {/* Nombre del empleado (DESTACADO Y BIEN LEGIBLE) */}
                        <div className="mb-1.5 pr-10">
                          <span className="text-sm font-extrabold text-slate-900 leading-snug block tracking-tight">
                            {turno.empleado.nombre} {turno.empleado.apellido}
                          </span>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              {turno.empleado.rol}
                            </span>
                            {carnetAlerta}
                          </div>
                        </div>

                        {/* Local badge */}
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${localColorClass}`}
                          >
                            <Building2 className="w-3 h-3 shrink-0" />
                            {turno.local.nombreLocal}
                          </span>
                        </div>

                        {/* Horario y Duración */}
                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-700">
                          <span className="font-mono font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600 shrink-0 no-print" />
                            {turno.horaInicio} - {turno.horaFin}
                          </span>
                          <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded">
                            {turno.duracionHoras}h
                          </span>
                        </div>

                        {turno.cruzaMedianoche && (
                          <div className="mt-1 text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
                            <Moon className="w-2.5 h-2.5" /> Turno cruza medianoche (+1)
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition no-print bg-white/90 rounded-lg p-0.5 border border-slate-200 shadow-xs">
                          <button
                            onClick={() => openModal(undefined, undefined, turno)}
                            disabled={isPending}
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Modificar turno"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleEliminarTurno(turno.id)}
                            disabled={isPending}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                            title="Eliminar turno"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Banner de colaboradores de vacaciones hoy */}
                {empleadosDeVacacionesHoy.length > 0 && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] space-y-1 mt-2">
                    <span className="font-bold flex items-center gap-1 text-emerald-800">
                      <Palmtree className="w-3 h-3 text-emerald-600 shrink-0" />
                      De Vacaciones:
                    </span>
                    {empleadosDeVacacionesHoy.map((e) => (
                      <span key={e.id} className="block text-[10px] text-emerald-700 font-medium truncate">
                        • {e.nombre} {e.apellido}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Asignar / Editar Turno */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                {editingTurnoId ? (
                  <>
                    <Edit2 className="w-5 h-5 text-blue-600" />
                    Modificar Turno Horario
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    Asignar Turno en la Grilla
                  </>
                )}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Advertencia si el empleado está de vacaciones en esa fecha */}
              {conflictoVacacionesModal && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2 font-medium">
                  <Palmtree className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Colaborador No Disponible</strong>
                    <span>{conflictoVacacionesModal}</span>
                  </div>
                </div>
              )}

              {/* Modalidad de Asignación */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Modalidad de Turno *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo("PUNTUAL")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      tipo === "PUNTUAL"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Fecha Puntual
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo("RECURRENTE")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      tipo === "RECURRENTE"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Semanal Recurrente
                  </button>
                </div>
              </div>

              {/* Empleado y Local */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empleado / Personal *
                  </label>
                  <select
                    value={empleadoId}
                    onChange={(e) => setEmpleadoId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} {emp.apellido} ({emp.rol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sucursal / Local *
                  </label>
                  <select
                    value={localId}
                    onChange={(e) => setLocalId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {locales.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nombreLocal} ({loc.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha o Día de la semana */}
              {tipo === "PUNTUAL" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha del Turno *
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Día de la Semana *
                  </label>
                  <select
                    value={diaSemana}
                    onChange={(e) => setDiaSemana(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {diasSemana.map((d) => (
                      <option key={d.diaId} value={d.diaId}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora Inicio (HH:mm) *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora Fin (HH:mm) *
                  </label>
                  <input
                    type="time"
                    required
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Resumen de duración */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Duración estimada:</span>
                  <span className="font-bold text-slate-900 ml-1.5">{calculoEnVivo.duracionHoras} hrs</span>
                </div>
                {calculoEnVivo.cruzaMedianoche && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    <Moon className="w-3 h-3 text-indigo-600" />
                    Cruza medianoche (+1 día)
                  </span>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Turno rotativo de fin de semana"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || Boolean(conflictoVacacionesModal)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Guardando..." : "Confirmar Turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
