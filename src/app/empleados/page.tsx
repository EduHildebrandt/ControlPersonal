import { getEmpleados } from "@/actions/empleados";
import { getLocales } from "@/actions/locales";
import { EmpleadosClient } from "./EmpleadosClient";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EmpleadosPage() {
  const [empRes, locRes, session] = await Promise.all([
    getEmpleados(),
    getLocales(),
    getSession(),
  ]);

  const empleados = empRes.data || [];
  const locales = (locRes.data || []).filter((l: any) => l.activo);

  return (
    <EmpleadosClient
      initialEmpleados={empleados as any}
      localesDisponibles={locales as any}
      isSuperusuario={session?.rol === "SUPERUSUARIO"}
    />
  );
}
