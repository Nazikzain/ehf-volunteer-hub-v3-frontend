import { createFileRoute } from "@tanstack/react-router";
import { PortalProjects } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/projects")({
  head: () => meta("My Projects"),
  component: PortalProjects,
});
