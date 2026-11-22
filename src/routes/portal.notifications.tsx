import { createFileRoute } from "@tanstack/react-router";
import { PortalNotifications } from "@/components/ehf/PortalWorkspaces";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/notifications")({
  head: () => meta("Volunteer Notifications"),
  component: PortalNotifications,
});
