"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
  Calendar,
  X,
  Search,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  guardarLocal,
  darBajaLogicaLocal,
  reactivarLocal,
  darBajaDefinitivaLocal,
} from "@/actions/locales";

interface LocalItem {
  id: string;
  codigo: string;
  nombreLocal: string;
  direccion: string;
  activo: boolean;
  _count: {
    empleados: number;
    turnos: number;
  };
}

export function LocalesClient({
  initialLocales,
  isSuperusuario = false,
}: {
  initialLocales: LocalItem[];
  isSuperusuario?: boolean;
}) {
  const [locales, setLocales] = useState<LocalItem[]>(initialLocales);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocal, setEditingLocal] = useState<LocalItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Confirmations modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    tipo: "BAJA_LOGICA" | "BAJA_DEFINITIVA" | "REACTIVAR";
    local: LocalItem | null;
  }>({
    open: false,
    tipo: "BAJA_LOGICA",
    local: null,
  });

  // Form states
  const [codigo, setCodigo] = useState("");
  const [nombreLocal, setNombreLocal] = useState("");
  const [direccion, setDireccion] = useState("");
  const [activo, setActivo] = useState(true);

  const openModal = (local?: LocalItem) => {
    setErrorMsg(null);
    if (local) {
      setEditingLocal(local);
      setCodigo(local.codigo);
      setNombreLocal(local.nombreLocal);
      setDireccion(local.direccion);
      setActivo(local.activo);
    } else {
      setEditingLocal(null);
      setCodigo("");
      setNombreLocal("");
      setDireccion("");
      setActivo(true);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLocal(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await guardarLocal({
        id: editingLocal?.id,
        codigo,
        nombreLocal,
        direccion,
        activo,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Error al guardar local.");
      } else {
        closeModal();
        window.location.reload();
      }
    });
  };

  const ejecutarAccionConfirmada = async () => {
    if (!confirmModal.local) return;
    const { tipo, local } = confirmModal;

    startTransition(async () => {
      if (tipo === "BAJA_LOGICA") {
        await darBajaLogicaLocal(local.id);
      } else if (tipo === "REACTIVAR") {
        await reactivarLocal(local.id);
      } else if (tipo === "BAJA_DEFINITIVA") {
        await darBajaDefinitivaLocal(local.id);
      }
      setConfirmModal({ open: false, tipo: "BAJA_LOGICA", local: null });
      window.location.reload();
    });
  };

  const filteredLocales = locales.filter(
    (l) =>
      l.nombreLocal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Gestión de Sucursales y Locales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra las sucursales habilitadas con soporte de baja lógica y eliminación definitiva.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Local</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Buscar local por código, nombre o dirección..."
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

      {/* Grid of Locales */}
      {filteredLocales.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No se encontraron locales</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {searchTerm
              ? "Prueba con otro término de búsqueda."
              : "Registra tus locales para comenzar a asignar turnos y empleados."}
          </p>
          {!searchTerm && (
            <button
              onClick={() => openModal()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Crear Local
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLocales.map((local) => (
            <div
              key={local.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                local.activo ? "border-slate-200" : "border-amber-200 bg-amber-50/20"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {local.codigo}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{local.nombreLocal}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      local.activo
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {local.activo ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-amber-600" /> Baja Lógica
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{local.direccion}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <span className="flex items-center gap-1" title="Empleados habilitados">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    {local._count.empleados} personal
                  </span>
                  <span className="flex items-center gap-1" title="Turnos activos">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" />
                    {local._count.turnos} turnos
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openModal(local)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                    title="Editar local"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {local.activo ? (
                    /* Botón de Baja Lógica */
                    <button
                      onClick={() =>
                        setConfirmModal({
                          open: true,
                          tipo: "BAJA_LOGICA",
                          local,
                        })
                      }
                      disabled={isPending}
                      className="text-xs font-semibold px-2 py-1 rounded text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                      title="Dar de baja lógica"
                    >
                      Baja Lógica
                    </button>
                  ) : (
                    /* Acciones para local en Baja Lógica: Reactivar o Baja Definitiva */
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setConfirmModal({
                            open: true,
                            tipo: "REACTIVAR",
                            local,
                          })
                        }
                        disabled={isPending}
                        className="p-1 rounded text-emerald-700 hover:bg-emerald-50 transition"
                        title="Reactivar local"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {isSuperusuario && (
                        <button
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              tipo: "BAJA_DEFINITIVA",
                              local,
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmación para Bajas */}
      {confirmModal.open && confirmModal.local && (
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
                    Sucursal:{" "}
                    <span className="font-semibold text-slate-800">
                      [{confirmModal.local.codigo}] {confirmModal.local.nombreLocal}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-lg text-xs leading-relaxed border bg-slate-50 border-slate-200">
                {confirmModal.tipo === "BAJA_LOGICA" && (
                  <p className="text-slate-700">
                    Al dar de <strong>baja lógica</strong>, el local quedará inactivo. No aparecerá disponible para asignar nuevos turnos o empleados, pero sus datos e historial previo se conservarán. Posteriormente podrás reactivarlo o darlo de baja definitiva.
                  </p>
                )}

                {confirmModal.tipo === "REACTIVAR" && (
                  <p className="text-slate-700">
                    La sucursal volverá a estar <strong>activa</strong> y disponible para asignación de turnos y personal en la grilla semanal.
                  </p>
                )}

                {confirmModal.tipo === "BAJA_DEFINITIVA" && (
                  <p className="text-rose-700 font-medium">
                    ⚠️ <strong>¡Acción Irreversible!</strong> La sucursal será borrada permanentemente de la base de datos de Supabase junto con sus registros vinculados.
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: false, tipo: "BAJA_LOGICA", local: null })}
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

      {/* Modal Alta / Edición */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingLocal ? "Editar Sucursal / Local" : "Registrar Nueva Sucursal"}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Local (Identificador) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MARMAU o PUNTO-1"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Local *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MarMau o Punto 1"
                  value={nombreLocal}
                  onChange={(e) => setNombreLocal(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección Física *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. San Martín 1234, Ciudad"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activoCheckbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="activoCheckbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Local habilitado y activo
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
                  {isPending ? "Guardando..." : editingLocal ? "Actualizar Local" : "Crear Local"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
