import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ehf/ui";
import { Facts } from "@/components/ehf/DetailBits";
import { Button } from "@/components/ui/button";
import { usePortalActor } from "@/lib/portal-actor";
import { getWorkflow, setWorkflow, useWorkflow } from "@/lib/workflow-store";
import { validateAvailability, WEEKDAYS, type AvailabilityType } from "@/lib/volunteer-workflow";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/profile")({
  head: () => meta("My Profile"),
  component: Profile,
});
function Profile() {
  const actor = usePortalActor(),
    wf = useWorkflow(),
    v = wf.volunteers.find((v) => v.id === actor.volunteerId);
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState({
      name: v?.name ?? "",
      phone: v?.phone ?? "",
      address: v?.address ?? "",
      postcode: v?.postcode ?? "",
      language: v?.language ?? "",
      skills: v?.skills ?? "",
      availabilityType: v?.availabilityType ?? ("Flexible" as AvailabilityType),
      availabilityDays: v?.availabilityDays ?? [],
    }),
    [error, setError] = useState("");
  if (!v) return null;
  const reset = () => {
    setDraft({
      name: v.name,
      phone: v.phone,
      address: v.address,
      postcode: v.postcode,
      language: v.language,
      skills: v.skills,
      availabilityType: v.availabilityType,
      availabilityDays: v.availabilityDays,
    });
    setError("");
  };
  return (
    <>
      <PageHeader
        title="My Profile"
        action={
          !editing ? (
            <Button
              onClick={() => {
                reset();
                setEditing(true);
              }}
            >
              Edit Profile
            </Button>
          ) : undefined
        }
      />
      <section className="border-b pb-6">
        <Facts
          items={[
            ["Volunteer ID", v.id],
            ["Role", "Volunteer"],
            ["Registered email", v.email],
            ["Administrative status", v.status],
            ["Volunteer start date", v.startDate],
            ["Volunteer end date", v.endDate || "Not set"],
            ["Nationality", v.nationality],
            ["Emergency contact", "Not provided"],
            [
              "Interests",
              wf.applications.find((a) => a.volunteerId === v.id)?.interest || "Community support",
            ],
          ]}
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Registered email changes require authorised verification; unavailable in this demo.
        </p>
      </section>
      {editing ? (
        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const err = validateAvailability(draft.availabilityType, draft.availabilityDays);
            if (err || !draft.name.trim()) {
              setError(err || "Full name is required");
              return;
            }
            const s = getWorkflow();
            setWorkflow({
              ...s,
              volunteers: s.volunteers.map((x) => (x.id === v.id ? { ...x, ...draft } : x)),
            });
            setEditing(false);
            toast.success("Profile saved in demo memory");
          }}
        >
          {(
            [
              ["name", "Full name"],
              ["phone", "Phone number"],
              ["address", "Address"],
              ["postcode", "Postcode"],
              ["language", "Preferred language"],
              ["skills", "Skills & experience"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                className="mt-1 w-full rounded-md border bg-card px-3 py-2"
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Availability
            <select
              className="mt-1 w-full rounded-md border bg-card px-3 py-2"
              value={draft.availabilityType}
              onChange={(e) => {
                const t = e.target.value as AvailabilityType;
                setDraft({
                  ...draft,
                  availabilityType: t,
                  availabilityDays: t === "Flexible" ? [] : draft.availabilityDays,
                });
              }}
            >
              <option>Specific Days of the Week</option>
              <option>Flexible</option>
            </select>
          </label>
          {draft.availabilityType === "Specific Days of the Week" && (
            <fieldset className="sm:col-span-2">
              <legend>Available weekdays</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {WEEKDAYS.map((d) => (
                  <label key={d} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={draft.availabilityDays.includes(d)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          availabilityDays: e.target.checked
                            ? [...draft.availabilityDays, d]
                            : draft.availabilityDays.filter((x) => x !== d),
                        })
                      }
                    />
                    {d}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">Save Changes</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setEditing(false);
              }}
            >
              Cancel Changes
            </Button>
          </div>
        </form>
      ) : (
        <section className="mt-6">
          <Facts
            items={[
              ["Full name", v.name],
              ["Phone", v.phone],
              ["Address", v.address],
              ["Postcode", v.postcode],
              ["Preferred language", v.language],
              ["Skills & experience", v.skills],
              [
                "Availability",
                v.availabilityType === "Flexible" ? "Flexible" : v.availabilityDays.join(", "),
              ],
            ]}
          />
        </section>
      )}
    </>
  );
}
