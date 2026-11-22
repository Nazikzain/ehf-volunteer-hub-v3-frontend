import { createFileRoute, redirect } from "@tanstack/react-router";
import { publicRegistrationDestination } from "@/lib/public-access-policy";
export const Route = createFileRoute("/register")({
  beforeLoad: () => { throw redirect({ to: publicRegistrationDestination() }); },
  head: () => ({ meta: [
    { title: "Accepted Volunteer Access — EHF Volunteer Hub" },
    { name: "description", content: "EHF portal access is provided by invitation to accepted volunteers." },
    { property: "og:title", content: "Accepted Volunteer Access — EHF Volunteer Hub" },
    { property: "og:description", content: "Sign in with your existing invited volunteer account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
