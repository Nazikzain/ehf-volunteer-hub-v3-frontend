import { createFileRoute } from "@tanstack/react-router";
import { PhpWorkspace } from "@/components/ehf/PhpWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/audit")({ head: () => meta("EHF Audit History"), component: () => <PhpWorkspace screen="admin/audit" /> });