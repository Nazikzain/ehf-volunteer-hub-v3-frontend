import { createFileRoute } from "@tanstack/react-router";
import { AttendanceWorkspace } from "@/components/ehf/AttendanceWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/time-logs")({
  head: () => meta("Attendance & Hours"),
  component: AttendanceWorkspace,
});
