import { createFileRoute } from "@tanstack/react-router";
import { TaskReports } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/task-reports")({
  head: () => meta("My Task Reports"),
  component: () => <TaskReports />,
});
