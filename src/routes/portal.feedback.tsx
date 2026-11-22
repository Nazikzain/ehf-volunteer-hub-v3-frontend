import { createFileRoute } from "@tanstack/react-router";
import { PortalPerformance } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/portal/feedback")({
  head: () => meta("My Feedback"),
  component: PortalPerformance,
});
