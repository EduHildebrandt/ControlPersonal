import { getUsuarios } from "@/actions/auth";
import { UsuariosClient } from "./UsuariosClient";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await getSession();

  if (!session || session.rol !== "SUPERUSUARIO") {
    redirect("/");
  }

  const res = await getUsuarios();
  const usuarios = res.data || [];

  return <UsuariosClient initialUsuarios={usuarios as any} />;
}
