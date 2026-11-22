import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home } from "lucide-react";
import { PublicLayout } from "@/components/ehf/PublicLayout";
import { useQueryClient } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";

export const Route = createFileRoute("/application-received")({
  head: () => ({ meta: [
    { title: "Application Received — EHF Volunteer Hub" },
    { name: "description", content: "Thank you for applying to volunteer with Ethnic Health Forum." },
    { property: "og:title", content: "Application Received — EHF Volunteer Hub" },
    { property: "og:description", content: "Thank you for applying to volunteer with Ethnic Health Forum." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Done,
});

function Done() {
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const receipt = hydrated ? queryClient.getQueryData<string>(["php-application-receipt"]) : undefined;
  const reference = receipt && /^[A-Z0-9]{10}$/.test(receipt) ? receipt : "";
  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-lg border bg-card p-10 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-20 w-20 text-success" />
          <h1 className="mt-4 text-3xl font-bold">Thank You!</h1>
          <p className="mt-2 text-muted-foreground">{reference ? "The EHF system issued your application reference." : "No confirmed application reference is available."}</p>
          <div className="mt-6 rounded-md bg-info-soft p-4">
            <p className="text-sm font-semibold">Application Reference</p>
            <p className="mt-1 font-display text-lg font-bold text-primary">{reference || "Not issued"}</p>
            {!reference && <p className="mt-1 text-xs text-muted-foreground">Nothing on this page confirms a submitted application.</p>}
          </div>
          {reference && <p className="mt-6 text-sm text-muted-foreground">Our team will review your application and contact you about next steps.</p>}
          <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"><Home className="h-4 w-4" /> Back to Home</Link>
        </div>
      </div>
    </PublicLayout>
  );
}
