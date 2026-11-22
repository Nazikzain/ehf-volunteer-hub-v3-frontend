import { describe, expect, it } from "vitest";
import { PUBLIC_REGISTRATION_ENABLED, publicRegistrationDestination } from "../lib/public-access-policy";
describe("accepted-volunteer public access", () => {
  it("permanently disables public registration", () => expect(PUBLIC_REGISTRATION_ENABLED).toBe(false));
  it("sends the retired public registration entry to the homepage", () => expect(publicRegistrationDestination()).toBe("/"));
});