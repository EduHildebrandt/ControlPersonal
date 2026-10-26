"use client";

import { useState, useTransition } from "react";
import { UserCog, Plus, Trash2, CheckCircle2, XCircle, Shield, X, Mail, Lock, User, AlertTriangle } from "lucide-react";
import { crearSupervisor, eliminarSupervisor, alternarEstadoSupervisor } from "@/actions/auth";

interface UsuarioItem {
  id: string;
  nombre: string;
  email: string;
  rol: "SUPERUSUARIO" | "SUPERVISOR";
  activo: boolean;
  createdAt: Date;
}

export function UsuariosClient({ initialUsuarios }: { initialUsuarios: UsuarioItem[] }) {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>(initialUsuarios);
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    usuario: UsuarioItem | null;
  }>({ open: false, usuario: null });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await crearSupervisor({ nombre, email, password });
      if (!res.success) {
        setErrorMsg(res.error || "Error al crear supervisor.");
      } else {
        setModalOpen(false);
        setNombre("");
        setEmail("");
        setPassword("");
        window.location.reload();
      }
    });
  };

  const handleDelete = () => {
    if (!confirmModal.usuario) return;
    startTransition(async () => {
      const res = await eliminarSupervisor(confirmModal.usuario!.id);
      if (res.success) {
        setConfirmModal({ open: false, usuario: null });
        window.location.reload();
      } else {
        alert(res.error || "Error al eliminar usuario.");
      }
    });
  };

  const handleToggle = (user: UsuarioItem) => {
    startTransition(async () => {
      const res = await alternarEstadoSupervisor(user.id, user.activo);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || "Error al cambiar estado.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6 text-amber-600" />
            Gestión de Usuarios y Supervisores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Módulo exclusivo de Superusuario: crea, administra y revoca accesos para el equipo de supervisores.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Supervisor</span>
        </button>
      </div>

      {/* VISTA MÓVIL (celulares y tablets pequeñas < md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {usuarios.map((u) => {
          const isSuper = u.rol === "SUPERUSUARIO";
          return (
            <div
              key={u.id}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSuper ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {u.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{u.nombre}</h3>
                    <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isSuper
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {u.rol}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                    u.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.activo ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" /> Inactivo
                    </>
                  )}
                </span>

                {!isSuper && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={isPending}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${
                        u.activo
                          ? "text-amber-700 hover:bg-amber-50 border border-amber-200"
                          : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                      }`}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      onClick={() => setConfirmModal({ open: true, usuario: u })}
                      disabled={isPending}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar supervisor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO Y TABLET (md y superior): Tabla de Usuarios */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Usuario</th>
                <th className="px-6 py-3.5 font-semibold">Correo Electrónico</th>
                <th className="px-6 py-3.5 font-semibold">Rol</th>
                <th className="px-6 py-3.5 font-semibold text-center">Estado</th>
                <th className="px-6 py-3.5 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const isSuper = u.rol === "SUPERUSUARIO";
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSuper
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {u.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{u.nombre}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.email}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight ${
                          isSuper
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {u.rol}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.activo ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" /> Inactivo
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isSuper ? (
                        <span className="text-xs text-slate-400 italic">No modificable</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={isPending}
                            className={`text-xs font-medium px-2.5 py-1 rounded transition ${
                              u.activo
                                ? "text-amber-700 hover:bg-amber-50 border border-amber-200"
                                : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            }`}
                          >
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            onClick={() => setConfirmModal({ open: true, usuario: u })}
                            disabled={isPending}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar supervisor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Supervisor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCog className="w-5 h-5 text-amber-600" />
                Registrar Nuevo Supervisor
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Marcos Pérez"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="supervisor@empresa.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña de Acceso (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                ℹ️ Los supervisores pueden operar la grilla, crear turnos, cargar personal y realizar bajas lógicas. No tienen permisos para bajas definitivas ni para gestionar otros usuarios.
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
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Crear Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {confirmModal.open && confirmModal.usuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Eliminar Supervisor</h3>
                <p className="text-xs text-slate-500">
                  ¿Confirmas eliminar permanentemente a <strong>{confirmModal.usuario.nombre}</strong>?
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Esta acción revocará inmediatamente todos los accesos del supervisor al sistema.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, usuario: null })}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isPending ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
