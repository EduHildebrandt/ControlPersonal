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
} from "lucide-react";
import { DIAS_SEMANA, formatHoras } from "@/lib/utils";
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
  locales: Array<{ localId: string }>;
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
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selector de día para pantallas móviles / tablets
  const [diaMovilSeleccionado, setDiaMovilSeleccionado] = useState<number | "ALL">("ALL");

  // Edición de turno
  const [editingTurnoId, setEditingTurnoId] = useState<string | null>(null);

  // Form states
  const [empleadoId, setEmpleadoId] = useState(empleados[0]?.id || "");
  const [localId, setLocalId] = useState(locales[0]?.id || "");
  const [tipo, setTipo] = useState<"RECURRENTE" | "PUNTUAL">("RECURRENTE");
  const [diaSemana, setDiaSemana] = useState<number>(1);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().substring(0, 10));
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("16:00");
  const [notas, setNotas] = useState("");

  // Duración calculada en vivo
  const calculoEnVivo = useMemo(() => {
    return calcularDuracionHoras(horaInicio, horaFin);
  }, [horaInicio, horaFin]);

  const openModal = (defaultDia?: number, turnoToEdit?: TurnoItem) => {
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
          : new Date().toISOString().substring(0, 10)
      );
      setHoraInicio(turnoToEdit.horaInicio);
      setHoraFin(turnoToEdit.horaFin);
      setNotas(turnoToEdit.notas || "");
    } else {
      setEditingTurnoId(null);
      if (defaultDia) {
        setDiaSemana(defaultDia);
        setTipo("RECURRENTE");
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

  const aplicarPreset = (inicio: string, fin: string) => {
    setHoraInicio(inicio);
    setHoraFin(fin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await guardarTurno({
        id: editingTurnoId || undefined,
        empleadoId,
        localId,
        tipo,
        diaSemana: tipo === "RECURRENTE" ? diaSemana : undefined,
        fecha: tipo === "PUNTUAL" ? fecha : undefined,
        horaInicio,
        horaFin,
        notas,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Error al asignar el turno.");
      } else {
        closeModal();
        window.location.reload();
      }
    });
  };

  const handleEliminarTurno = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta asignación de turno?")) return;
    startTransition(async () => {
      await eliminarTurno(id);
      window.location.reload();
    });
  };

  const handleImprimirGrilla = () => {
    window.print();
  };

  // Filtrado de turnos
  const turnosFiltrados = turnos.filter((t) => {
    if (filtroLocal !== "ALL" && t.localId !== filtroLocal) return false;
    if (filtroEmpleado !== "ALL" && t.empleadoId !== filtroEmpleado) return false;
    return true;
  });

  const localSeleccionado = locales.find((l) => l.id === filtroLocal);
  const empleadoSeleccionado = empleados.find((e) => e.id === filtroEmpleado);

  // Días a renderizar según el selector móvil
  const diasAMostrar =
    diaMovilSeleccionado === "ALL"
      ? DIAS_SEMANA
      : DIAS_SEMANA.filter((d) => d.id === diaMovilSeleccionado);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Printable Header (Visible solo al imprimir) */}
      <div className="print-only-header pb-4 mb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              SISTEMA DE CONTROL DE PERSONAL - PROGRAMACIÓN SEMANAL DE TURNOS (24/7)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Filtro:{" "}
              <strong>
                {localSeleccionado ? `Sucursal: ${localSeleccionado.nombreLocal}` : "Todas las sucursales"} |{" "}
                {empleadoSeleccionado ? `Colaborador: ${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido}` : "Todo el personal"}
              </strong>
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Fecha de emisión: {new Date().toLocaleDateString("es-ES")}</p>
            <p className="font-semibold text-slate-700">TurnoMaster Pro</p>
          </div>
        </div>
      </div>

      {/* Screen Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Grilla Semanal de Turnos (24/7)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Programa horarios semanales repetitivos o puntuales con validación anti-solapamiento.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleImprimirGrilla}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition shadow-sm"
            title="Imprimir grilla o guardar como PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={() => openModal()}
            disabled={empleados.length === 0 || locales.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Asignar Turno</span>
          </button>
        </div>
      </div>

      {/* Bar Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 text-xs no-print">
        <div className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtros:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-1">
          {/* Local Filter */}
          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium shrink-0">Local:</label>
            <select
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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

      {/* SELECTOR RÁPIDO DE DÍA PARA MÓVILES (Celulares / Tablets pequeñas) */}
      <div className="lg:hidden no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setDiaMovilSeleccionado("ALL")}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition ${
              diaMovilSeleccionado === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Todos los días
          </button>
          {DIAS_SEMANA.map((dia) => (
            <button
              key={dia.id}
              onClick={() => setDiaMovilSeleccionado(dia.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition ${
                diaMovilSeleccionado === dia.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {dia.corto}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla Semanal: 1 columna en móvil, 2 en tablets, 7 en notebooks / escritorios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 print-grid-7">
        {diasAMostrar.map((dia) => {
          const turnosDelDia = turnosFiltrados.filter(
            (t) => t.tipo === "RECURRENTE" && t.diaSemana === dia.id
          );

          const totalHorasDia = turnosDelDia.reduce((acc, curr) => acc + curr.duracionHoras, 0);

          return (
            <div
              key={dia.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[320px] lg:min-h-[380px] overflow-hidden print-card"
            >
              {/* Day Header */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{dia.nombre}</h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {turnosDelDia.length} {turnosDelDia.length === 1 ? "turno" : "turnos"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-700 block">
                    {formatHoras(totalHorasDia)}
                  </span>
                  <button
                    onClick={() => openModal(dia.id)}
                    className="p-1 hover:bg-slate-200/70 text-slate-600 rounded transition mt-0.5 no-print"
                    title={`Agregar turno para ${dia.nombre}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Shifts */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {turnosDelDia.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                    <Clock className="w-6 h-6 mb-1 opacity-40 no-print" />
                    <span className="text-xs italic">Sin turnos asignados</span>
                  </div>
                ) : (
                  turnosDelDia.map((turno) => (
                    <div
                      key={turno.id}
                      className={`p-2.5 rounded-lg border text-xs relative group transition-all ${
                        turno.cruzaMedianoche
                          ? "bg-indigo-50/70 border-indigo-200"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Horario y Badges */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono font-bold text-slate-900 flex items-center gap-1 text-[11px] sm:text-xs">
                          <Clock className="w-3 h-3 text-blue-600 no-print shrink-0" />
                          {turno.horaInicio} - {turno.horaFin}
                        </span>

                        {turno.cruzaMedianoche && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-semibold shrink-0"
                            title="Turno nocturno: Cruza la medianoche"
                          >
                            <Moon className="w-2.5 h-2.5 no-print" /> Nocturno
                          </span>
                        )}
                      </div>

                      {/* Empleado info */}
                      <div className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0 no-print" />
                        <span className="truncate">
                          {turno.empleado.nombre} {turno.empleado.apellido}
                        </span>
                      </div>

                      {/* Local info */}
                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60">
                        <span className="font-medium flex items-center gap-1 truncate text-emerald-700">
                          <Building2 className="w-3 h-3 text-emerald-600 shrink-0 no-print" />
                          {turno.local.nombreLocal}
                        </span>
                        <span className="font-bold text-slate-700 shrink-0">{turno.duracionHoras}h</span>
                      </div>

                      {/* Actions: Edit & Delete buttons */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition no-print bg-white/80 backdrop-blur-xs rounded-md p-0.5 shadow-xs border border-slate-200">
                        <button
                          onClick={() => openModal(undefined, turno)}
                          disabled={isPending}
                          className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Modificar turno"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleEliminarTurno(turno.id)}
                          disabled={isPending}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded transition"
                          title="Eliminar turno"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Asignar Turno */}
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
                    Asignar Turno Horario
                  </>
                )}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
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

              {/* Selector Tipo de Turno */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Modalidad de Asignación *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo("RECURRENTE")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      tipo === "RECURRENTE"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Turno Semanal Recurrente
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo("PUNTUAL")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      tipo === "PUNTUAL"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Fecha Puntual Específica
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {locales.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nombreLocal} ({loc.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Día o Fecha */}
              {tipo === "RECURRENTE" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Día de la Semana (Lunes a Domingo) *
                  </label>
                  <select
                    value={diaSemana}
                    onChange={(e) => setDiaSemana(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha del Calendario *
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Presets Rápidos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plantillas Rápidas de Horario:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => aplicarPreset("08:00", "16:00")}
                    className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 truncate"
                  >
                    Mañana 08-16
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("16:00", "00:00")}
                    className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 truncate"
                  >
                    Tarde 16-00
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset("22:00", "06:00")}
                    className="px-2 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-[11px] font-medium text-indigo-700 border border-indigo-200 truncate"
                  >
                    Noche 22-06
                  </button>
                </div>
              </div>

              {/* Rango de Horas */}
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Resumen de cálculo en vivo */}
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-700">Duración:</span>
                  <span className="font-bold text-blue-900 text-sm">
                    {calculoEnVivo.duracionHoras} hrs
                  </span>
                </div>

                {calculoEnVivo.cruzaMedianoche && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                    <Moon className="w-3 h-3" /> Cruza medianoche (+1)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: Turno rotativo fin de semana"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isPending
                    ? "Validando..."
                    : editingTurnoId
                    ? "Guardar Modificaciones"
                    : "Confirmar Turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
