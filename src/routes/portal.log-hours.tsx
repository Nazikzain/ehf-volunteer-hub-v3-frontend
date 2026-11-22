import { createFileRoute } from "@tanstack/react-router";
import { AttendanceWorkspace } from "@/components/ehf/AttendanceWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/log-hours")({
   head: () => meta("Manual Hours Entry"),
  component: () => <AttendanceWorkspace portal daily />,
});
