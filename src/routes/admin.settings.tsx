import { createFileRoute } from "@tanstack/react-router";
import { Info, Database, Activity, Plug, Mail, HardDrive, Archive, ScrollText, ShieldCheck, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ehf/ui";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin/settings")({ head: () => meta("System Settings"), component: Page });

// Synthetic demo sections only — real settings live in the EHF system.
const sections = [
  { icon: Info, title: "System Information", desc: "Application version, environment and configuration summary." },
  { icon: Database, title: "Database Status", desc: "Connection state, storage usage and table health." },
  { icon: Activity, title: "System Health", desc: "Uptime, performance and service checks." },
  { icon: Plug, title: "API Configuration", desc: "Endpoints, integration keys and webhook settings." },
  { icon: Mail, title: "Email Configuration", desc: "Sender addresses, templates and delivery settings." },
  { icon: HardDrive, title: "File Storage", desc: "Upload locations, quotas and capacity." },
  { icon: Archive, title: "Backup & Recovery", desc: "Backup schedule, retention and restore points." },
  { icon: ScrollText, title: "Error Logs", desc: "Recent system errors and warnings." },
  { icon: ShieldCheck, title: "Security & Sessions", desc: "Session timeouts, lockouts and access policies." },
  { icon: Wrench, title: "Maintenance Mode", desc: "Take the system offline for planned maintenance." },
];

function Page() {
  return (<>
    <PageHeader title="System Settings" subtitle="Technical System Administrator only · synthetic demo values — real settings are managed by the EHF system" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map((s) => (
        <section key={s.title} className="rounded-lg border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <s.icon className="h-6 w-6 text-primary" />
            <span className="rounded bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">Demo</span>
          </div>
          <h2 className="mt-3 text-base font-bold">{s.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
        </section>
      ))}
    </div>
  </>);
}
