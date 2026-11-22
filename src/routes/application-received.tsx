import { createFileRoute, redirect } from "@tanstack/react-router";
import { publicRegistrationDestination } from "@/lib/public-access-policy";

// Public volunteer applications are discontinued in V3: volunteers are created internally by
// staff and invited to the portal. This retired receipt URL always returns to the homepage, so
// no page can appear to confirm a public application.
export const Route = createFileRoute("/application-received")({
  beforeLoad: () => {
    throw redirect({ to: publicRegistrationDestination() });
  },
  head: () => ({
    meta: [
      { title: "Accepted Volunteer Access — EHF Volunteer Hub" },
      {
        name: "description",
        content: "EHF portal access is provided by invitation to accepted volunteers.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});
