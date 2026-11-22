import { createFileRoute } from "@tanstack/react-router";
import { PhpAccountRecovery } from "@/components/ehf/PhpAccountRecovery";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal-reset")({
  head: () => meta("Reset EHF Account Password"),
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search["token"] === "string" ? search["token"] : "" }),
  component: Reset,
});
function Reset() { return <PhpAccountRecovery mode="reset" token={Route.useSearch().token} />; }