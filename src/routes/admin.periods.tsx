import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/periods")({
  head: () => ({ meta: [
    { title: "Volunteering Period History | EHF Volunteer Hub" },
    { name: "description", content: "Authorised volunteering period and completion history in EHF Volunteer Hub." },
    { property: "og:title", content: "Volunteering Period History | EHF Volunteer Hub" },
    { property: "og:description", content: "Authorised volunteering period and completion history." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => null,
});