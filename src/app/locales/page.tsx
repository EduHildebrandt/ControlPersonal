import { getLocales } from "@/actions/locales";
import { LocalesClient } from "./LocalesClient";

export const dynamic = "force-dynamic";

export default async function LocalesPage() {
  const res = await getLocales();
  const locales = res.data || [];

  return <LocalesClient initialLocales={locales as any} />;
}
