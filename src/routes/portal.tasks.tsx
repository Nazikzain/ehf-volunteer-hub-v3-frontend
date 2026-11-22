import { createFileRoute } from "@tanstack/react-router";
import { PortalTasks } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/tasks")({
  head: () => meta("My Tasks"),
  component: PortalTasks,
});
