import { createFileRoute } from "@tanstack/react-router";
import { AdminProjects } from "@/components/ehf/AdminPortalManagement";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/projects")({
  head: () => meta("Projects"),
  component: AdminProjects,
});
