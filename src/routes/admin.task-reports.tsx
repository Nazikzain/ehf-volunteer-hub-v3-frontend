import { createFileRoute } from "@tanstack/react-router";
import { TaskReports } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/task-reports")({
  head: () => meta("Task Report Reviews"),
  component: () => <TaskReports admin />,
});
