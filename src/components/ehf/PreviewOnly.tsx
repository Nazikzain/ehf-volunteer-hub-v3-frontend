import { useEffect, useState, type ReactNode } from "react";
import { demoModeAllowed } from "@/lib/demo-mode";
import { PublicLayout } from "./PublicLayout";
export function PreviewOnly({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<boolean | null>(null);
  useEffect(() => { setPreview(demoModeAllowed()); }, []);
  if (preview === null) return <PublicLayout><p className="p-8">Loading…</p></PublicLayout>;
  if (!preview) return <PublicLayout><div className="mx-auto max-w-lg px-4 py-20"><h1 className="text-2xl font-bold">Portal access is not connected yet</h1><p className="mt-3 text-muted-foreground">Account activation will be managed by the EHF system after backend integration.</p></div></PublicLayout>;
  return <>{children}</>;
}