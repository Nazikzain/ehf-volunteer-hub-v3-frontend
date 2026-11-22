import { createFileRoute } from "@tanstack/react-router";
import { PortalPerformance } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/performance")({
  head: () => meta("My Performance"),
  component: PortalPerformance,
});
