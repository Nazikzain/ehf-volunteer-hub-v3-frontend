import { createFileRoute } from "@tanstack/react-router";
import { AssignmentWorkspace } from "@/components/ehf/AssignmentWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/assignments")({
  head: () => meta("Volunteer Assignments"),
  component: AssignmentWorkspace,
});
