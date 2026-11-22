import { createFileRoute } from "@tanstack/react-router";
import { PortalAccessScreen } from "@/components/ehf/PortalAccessScreen";
import { meta } from "@/lib/meta";
import { PhpAccountRecovery } from "@/components/ehf/PhpAccountRecovery";
import { usePhpIntegration } from "@/lib/php-api";
export const Route = createFileRoute("/portal-activate")({
  head: () => meta("Activate EHF Account"),
  validateSearch: (s: Record<string, unknown>): { invitation?: string; token?: string } => ({
    ...(typeof s["invitation"] === "string" ? { invitation: s["invitation"] } : {}),
    ...(typeof s["token"] === "string" ? { token: s["token"] } : {}),
  }),
  component: () => {
    const { invitation, token } = Route.useSearch();
    const connected = usePhpIntegration();
    if (connected === null) return <p role="status">Checking EHF connection…</p>;
    return connected ? <PhpAccountRecovery mode="activate" token={token ?? ""} /> : <PortalAccessScreen invitation={invitation ?? ""} />;
  },
});
