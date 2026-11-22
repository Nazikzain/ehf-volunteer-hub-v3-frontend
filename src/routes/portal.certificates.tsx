import { createFileRoute } from "@tanstack/react-router";
import { CertificateWorkspace } from "@/components/ehf/CertificateWorkspace";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/certificates")({
  head: () => meta("My Certificates"),
  component: () => <CertificateWorkspace portal />,
});
