import { getEmpleados } from "@/actions/empleados";
import { ReportesClient } from "./ReportesClient";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const empRes = await getEmpleados();
  const empleados = (empRes.data || []).filter((e: any) => e.activo);

  return <ReportesClient empleados={empleados as any} />;
}
