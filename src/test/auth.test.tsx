import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  search: {} as { mode?: string },
  signUp: vi.fn(), signIn: vi.fn(), navigate: vi.fn(), error: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ options, useSearch: () => mocks.search }),
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signUp: mocks.signUp, signInWithPassword: mocks.signIn } } }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
vi.mock("@/components/brand", () => ({ Logo: () => <span>MedScribe</span> }));
import { Route } from "@/routes/auth";

const AuthPage = Route.options.component as React.ComponentType;
function submit(label: string) {
  fireEvent.change(screen.getByLabelText("Username"), { target: { value: "Dr_Priya" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password-123!" } });
  fireEvent.click(screen.getByRole("button", { name: label }));
}

beforeEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); mocks.search = {}; });
describe("password-only auth flow", () => {
  it("signs in through the real auth client interface using the username identity", async () => {
    mocks.signIn.mockResolvedValue({ error: null });
    render(<AuthPage />); submit("Sign in");
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith({ email: "dr_priya@users.medscribe.invalid", password: "test-password-123!" }));
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it("keeps invalid credentials out of the workspace", async () => {
    mocks.signIn.mockResolvedValue({ error: new Error("Invalid credentials") });
    render(<AuthPage />); submit("Sign in");
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining("Unable to sign in")));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("blocks registration before sending mail when confirmation is enabled", async () => {
    mocks.search = { mode: "signup" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mailer_autoconfirm: false }) }));
    render(<AuthPage />); submit("Create account");
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining("not enabled yet")));
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it("registers a normalized username when the backend supports username-only accounts", async () => {
    mocks.search = { mode: "signup" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mailer_autoconfirm: true }) }));
    mocks.signUp.mockResolvedValue({ data: { session: { user: { id: "doctor-id" } } }, error: null });
    render(<AuthPage />); submit("Create account");
    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith({ email: "dr_priya@users.medscribe.invalid", password: "test-password-123!", options: { data: { username: "dr_priya" } } }));
  });
});
