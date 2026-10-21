import { getTurnos } from "@/actions/turnos";
import { getLocales } from "@/actions/locales";
import { getEmpleados } from "@/actions/empleados";
import { TurnosClient } from "./TurnosClient";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const [turnosRes, locRes, empRes] = await Promise.all([
    getTurnos(),
    getLocales(),
    getEmpleados(),
  ]);

  const turnos = turnosRes.data || [];
  const locales = (locRes.data || []).filter((l: any) => l.activo);
  const empleados = (empRes.data || []).filter((e: any) => e.activo);

  return (
    <TurnosClient
      initialTurnos={turnos as any}
      locales={locales as any}
      empleados={empleados as any}
    />
  );
}
