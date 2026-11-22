import { createFileRoute } from "@tanstack/react-router";
import { PortalAccessScreen } from "@/components/ehf/PortalAccessScreen";
import { meta } from "@/lib/meta";
import { usePhpIntegration } from "@/lib/php-api";
import { PhpPortalAccess } from "@/components/ehf/PhpPortalAccess";
function SignIn() {
  const connected = usePhpIntegration();
  if (connected === null) return <p role="status" className="p-8">Checking EHF connection…</p>;
  return connected ? <PhpPortalAccess /> : <PortalAccessScreen />;
}
export const Route = createFileRoute("/portal-login")({
  head: () => meta("EHF Account Sign-in"),
  component: SignIn,
});
