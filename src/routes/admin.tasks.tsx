import { createFileRoute } from "@tanstack/react-router";
import { PortalTasks } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/tasks")({
  head: () => meta("Tasks & Assignments"),
  component: () => <PortalTasks admin />,
});
