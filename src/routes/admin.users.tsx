import { createFileRoute } from "@tanstack/react-router";
import { AdminPermissionsWorkspace } from "@/components/ehf/AdminPermissionsWorkspace";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin/users")({ head: () => meta("Users & Permissions"), component: Page });

function Page() {
  return <AdminPermissionsWorkspace />;
}
