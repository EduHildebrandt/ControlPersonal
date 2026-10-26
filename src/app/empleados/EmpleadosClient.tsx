"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone,
  CreditCard,
  Building2,
  X,
  Search,
  Calendar,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  guardarEmpleado,
  darBajaLogicaEmpleado,
  reactivarEmpleado,
  darBajaDefinitivaEmpleado,
} from "@/actions/empleados";

interface LocalOption {
  id: string;
  codigo: string;
  nombreLocal: string;
  activo: boolean;
}

interface EmpleadoItem {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  locales: Array<{
    local: LocalOption;
  }>;
  _count: {
    turnos: number;
  };
}

export function EmpleadosClient({
  initialEmpleados,
  localesDisponibles,
  isSuperusuario = false,
}: {
  initialEmpleados: EmpleadoItem[];
  localesDisponibles: LocalOption[];
  isSuperusuario?: boolean;
}) {
  const [empleados, setEmpleados] = useState<EmpleadoItem[]>(initialEmpleados);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<EmpleadoItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    tipo: "BAJA_LOGICA" | "BAJA_DEFINITIVA" | "REACTIVAR";
    empleado: EmpleadoItem | null;
  }>({
    open: false,
    tipo: "BAJA_LOGICA",
    empleado: null,
  });

  // Form states
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState("Operador");
  const [activo, setActivo] = useState(true);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);

  const openModal = (emp?: EmpleadoItem) => {
    setErrorMsg(null);
    if (emp) {
      setEditingEmpleado(emp);
      setNombre(emp.nombre);
      setApellido(emp.apellido);
      setDni(emp.dni);
      setTelefono(emp.telefono || "");
      setRol(emp.rol);
      setActivo(emp.activo);
      setSelectedLocales(emp.locales.map((l) => l.local.id));
    } else {
      setEditingEmpleado(null);
      setNombre("");
      setApellido("");
      setDni("");
      setTelefono("");
      setRol("Operador");
      setActivo(true);
      setSelectedLocales(localesDisponibles.length > 0 ? [localesDisponibles[0].id] : []);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEmpleado(null);
    setErrorMsg(null);
  };

  const toggleLocalSelection = (localId: string) => {
    setSelectedLocales((prev) =>
      prev.includes(localId) ? prev.filter((id) => id !== localId) : [...prev, localId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await guardarEmpleado({
        id: editingEmpleado?.id,
        nombre,
        apellido,
        dni,
        telefono,
        rol,
        activo,
        localesIds: selectedLocales,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Error al procesar el empleado.");
      } else {
        closeModal();
        window.location.reload();
      }
    });
  };

  const ejecutarAccionConfirmada = async () => {
    if (!confirmModal.empleado) return;
    const { tipo, empleado } = confirmModal;

    startTransition(async () => {
      if (tipo === "BAJA_LOGICA") {
        await darBajaLogicaEmpleado(empleado.id);
      } else if (tipo === "REACTIVAR") {
        await reactivarEmpleado(empleado.id);
      } else if (tipo === "BAJA_DEFINITIVA") {
        await darBajaDefinitivaEmpleado(empleado.id);
      }
      setConfirmModal({ open: false, tipo: "BAJA_LOGICA", empleado: null });
      window.location.reload();
    });
  };

  const filteredEmpleados = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Gestión de Personal y Empleados
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra la nómina de colaboradores con sistema de baja lógica y eliminación definitiva.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, DNI o cargo..."
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

      {/* Empleados List */}
      {filteredEmpleados.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No se encontraron colaboradores</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {searchTerm
              ? "Prueba con otro término de búsqueda."
              : "Comienza registrando al personal para habilitarles turnos."}
          </p>
          {!searchTerm && (
            <button
              onClick={() => openModal()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Dar de Alta Personal
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Colaborador</th>
                  <th className="px-6 py-3.5 font-semibold">DNI / ID</th>
                  <th className="px-6 py-3.5 font-semibold">Rol / Cargo</th>
                  <th className="px-6 py-3.5 font-semibold">Locales Habilitados</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Turnos</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Estado</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmpleados.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !emp.activo ? "bg-amber-50/25" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {emp.nombre} {emp.apellido}
                      </div>
                      {emp.telefono && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{emp.telefono}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {emp.dni}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                        {emp.rol}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.locales.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Sin locales</span>
                        ) : (
                          emp.locales.map((l) => (
                            <span
                              key={l.local.id}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              <Building2 className="w-3 h-3 text-emerald-600" />
                              {l.local.nombreLocal}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700">
                        <Calendar className="w-3 h-3" />
                        {emp._count.turnos}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.activo
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {emp.activo ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-amber-600" /> Baja Lógica
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition"
                          title="Editar colaborador"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {emp.activo ? (
                          /* Botón Baja Lógica */
                          <button
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                tipo: "BAJA_LOGICA",
                                empleado: emp,
                              })
                            }
                            disabled={isPending}
                            className="text-xs font-semibold px-2.5 py-1 rounded text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                            title="Dar de baja lógica"
                          >
                            Baja Lógica
                          </button>
                        ) : (
                          /* Acciones en Baja Lógica: Reactivar o Baja Definitiva */
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setConfirmModal({
                                open: true,
                                tipo: "REACTIVAR",
                                empleado: emp,
                              })
                            }
                              disabled={isPending}
                              className="p-1 rounded text-emerald-700 hover:bg-emerald-50 transition"
                              title="Reactivar empleado"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {isSuperusuario && (
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    tipo: "BAJA_DEFINITIVA",
                                    empleado: emp,
                                  })
                                }
                                disabled={isPending}
                                className="text-xs font-bold px-2 py-1 rounded text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                                title="Eliminar definitivamente de la base de datos (Solo Superusuario)"
                              >
                                <Trash2 className="w-3 h-3" />
                                Baja Definitiva
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Bajas de Personal */}
      {confirmModal.open && confirmModal.empleado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    confirmModal.tipo === "BAJA_DEFINITIVA"
                      ? "bg-rose-100 text-rose-600"
                      : confirmModal.tipo === "BAJA_LOGICA"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {confirmModal.tipo === "BAJA_DEFINITIVA"
                      ? "Confirmar Baja Definitiva"
                      : confirmModal.tipo === "BAJA_LOGICA"
                      ? "Confirmar Baja Lógica"
                      : "Confirmar Reactivación"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Colaborador:{" "}
                    <span className="font-semibold text-slate-800">
                      {confirmModal.empleado.nombre} {confirmModal.empleado.apellido} (DNI: {confirmModal.empleado.dni})
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-lg text-xs leading-relaxed border bg-slate-50 border-slate-200">
                {confirmModal.tipo === "BAJA_LOGICA" && (
                  <p className="text-slate-700">
                    Al dar de <strong>baja lógica</strong>, el colaborador pasará a estado inactivo. Ya no aparecerá disponible para asignar nuevos turnos en la grilla, pero su historial de horas y datos se conservarán intactos. Podrás reactivarlo cuando lo requieras o darlo de baja definitiva.
                  </p>
                )}

                {confirmModal.tipo === "REACTIVAR" && (
                  <p className="text-slate-700">
                    El colaborador volverá a estar <strong>activo en nómina</strong> y disponible para turnos en sus locales habilitados.
                  </p>
                )}

                {confirmModal.tipo === "BAJA_DEFINITIVA" && (
                  <p className="text-rose-700 font-medium">
                    ⚠️ <strong>¡Acción Irreversible!</strong> El colaborador y todos sus turnos y registros asociados serán eliminados permanentemente de la base de datos de Supabase.
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: false, tipo: "BAJA_LOGICA", empleado: null })}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarAccionConfirmada}
                  disabled={isPending}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition disabled:opacity-50 ${
                    confirmModal.tipo === "BAJA_DEFINITIVA"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30"
                      : confirmModal.tipo === "BAJA_LOGICA"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/30"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30"
                  }`}
                >
                  {isPending
                    ? "Procesando..."
                    : confirmModal.tipo === "BAJA_DEFINITIVA"
                    ? "Sí, Eliminar Definitivamente"
                    : confirmModal.tipo === "BAJA_LOGICA"
                    ? "Confirmar Baja Lógica"
                    : "Confirmar Reactivación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alta / Edición de Empleado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingEmpleado ? "Editar Colaborador" : "Dar de Alta Nuevo Colaborador"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Carlos"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pérez"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DNI / Identificación *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 38123456"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: +54 9 11 2345-6789"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rol / Cargo *</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Operador">Operador</option>
                  <option value="Cajero">Cajero</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Seguridad">Seguridad (24hs)</option>
                  <option value="Encargado">Encargado de Local</option>
                  <option value="Supervisor">Supervisor de Turno</option>
                  <option value="Limpieza">Mantenimiento y Limpieza</option>
                </select>
              </div>

              {/* Selector de Locales Habilitados */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Locales / Sucursales Habilitadas
                </label>
                {localesDisponibles.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No hay locales registrados aún. Crea primero un local en la sección correspondiente.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-lg border border-slate-200 bg-slate-50/50">
                    {localesDisponibles.map((local) => {
                      const isSelected = selectedLocales.includes(local.id);
                      return (
                        <label
                          key={local.id}
                          className={`flex items-center gap-2 p-2 rounded-md text-xs cursor-pointer border transition-colors ${
                            isSelected
                              ? "bg-blue-50 border-blue-200 text-blue-900 font-medium"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLocalSelection(local.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">
                            <span className="font-mono font-bold text-[10px] text-slate-500 mr-1">
                              {local.codigo}
                            </span>
                            {local.nombreLocal}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activoEmpCheckbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="activoEmpCheckbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Empleado activo en nómina
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : editingEmpleado ? "Actualizar Empleado" : "Crear Empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
