import { createFileRoute } from "@tanstack/react-router";
import { CertificateWorkspace } from "@/components/ehf/CertificateWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/admin/certificates")({
  head: () => meta("Certificates"),
  component: () => <CertificateWorkspace />,
});
