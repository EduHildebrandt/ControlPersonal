import { getLocales } from "@/actions/locales";
import { LocalesClient } from "./LocalesClient";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LocalesPage() {
  const [res, session] = await Promise.all([getLocales(), getSession()]);
  const locales = res.data || [];

  return (
    <LocalesClient
      initialLocales={locales as any}
      isSuperusuario={session?.rol === "SUPERUSUARIO"}
    />
  );
}
