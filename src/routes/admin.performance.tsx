import { createFileRoute } from "@tanstack/react-router";
import { AdminPerformanceWorkspace } from "@/components/ehf/AdminPerformanceWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/performance")({
  head: () => meta("Performance Reviews"),
  component: AdminPerformanceWorkspace,
});
