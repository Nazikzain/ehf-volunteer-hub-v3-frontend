import { createFileRoute } from "@tanstack/react-router";
import { AttendanceWorkspace } from "@/components/ehf/AttendanceWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/hours")({
  head: () => meta("My Attendance & Hours"),
  component: () => <AttendanceWorkspace portal daily />,
});
