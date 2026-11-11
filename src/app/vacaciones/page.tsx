import { getResumenVacaciones, getVacacionesCalendario } from "@/actions/vacaciones";
import { VacacionesClient } from "./VacacionesClient";

export const dynamic = "force-dynamic";

export default async function VacacionesPage() {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  const [resumenRes, calendarioRes] = await Promise.all([
    getResumenVacaciones(),
    getVacacionesCalendario(currentMonth, currentYear),
  ]);

  const empleadosResumen = resumenRes.success ? resumenRes.data || [] : [];
  const vacacionesIniciales = calendarioRes.success ? (calendarioRes.data as any[]) || [] : [];

  return (
    <VacacionesClient
      initialResumen={empleadosResumen}
      initialVacacionesMes={vacacionesIniciales}
      initialMes={currentMonth}
      initialAnio={currentYear}
    />
  );
}
