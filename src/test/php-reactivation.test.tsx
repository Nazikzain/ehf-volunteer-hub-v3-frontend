import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ request: vi.fn(), navigate: vi.fn() }));
vi.mock("@/lib/php-api", () => ({ phpRequest: mocks.request }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate, Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/components/ehf/PublicLayout", () => ({ PublicLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
import { PhpPortalAccess } from "@/components/ehf/PhpPortalAccess";
describe("PHP reactivation sign-in", () => {
  it("replaces the signed-out session with the confirmed login and removes old workspace records", async () => {
    const confirmed = { access: { authenticated: true, role: "volunteer", volunteer_id: 2503, capabilities: {} } };
    mocks.request.mockImplementation((path: string) => Promise.resolve(path === "login" ? confirmed : { access: { authenticated: false } }));
    const client = new QueryClient();
    client.setQueryData(["php-session"], { access: { authenticated: false } });
    client.setQueryData(["php-screen", "portal/profile"], { rows: [{ id: 2 }] });
    render(<QueryClientProvider client={client}><PhpPortalAccess /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText("Registered email"), { target: { value: "reactivation@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Synthetic fixture input" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form") as HTMLFormElement);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/portal" }));
    expect(client.getQueryData(["php-session"])).toEqual(confirmed);
    expect(client.getQueryData(["php-screen", "portal/profile"])).toBeUndefined();
  });
});