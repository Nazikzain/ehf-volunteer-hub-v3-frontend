import { describe, expect, it } from "vitest";
import { isPreviewHost } from "@/lib/admin-login";

describe("admin demo mode host check", () => {
  it("opens on the Lovable preview", () => expect(isPreviewHost("id-preview--a0072528-7354-4063-9e1b-e6537ad3f95f.lovable.app")).toBe(true));
  it("opens on numbered/commit previews", () => expect(isPreviewHost("id-preview-6--a0072528-7354-4063-9e1b-e6537ad3f95f.lovable.app")).toBe(true));
  it("stays locked on the published site", () => expect(isPreviewHost("ethnic-health-hub.lovable.app")).toBe(false));
  it("stays locked on a custom domain", () => expect(isPreviewHost("volunteers.ethnichealth.org.uk")).toBe(false));
  it("stays locked on look-alike hosts", () => expect(isPreviewHost("id-preview--x.lovable.app.evil.com")).toBe(false));
});
