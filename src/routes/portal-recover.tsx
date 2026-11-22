import { createFileRoute } from "@tanstack/react-router";
import { PhpAccountRecovery } from "@/components/ehf/PhpAccountRecovery";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal-recover")({ head: () => meta("EHF Account Recovery"), component: () => <PhpAccountRecovery mode="recover" /> });