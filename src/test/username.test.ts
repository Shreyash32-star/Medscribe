import { describe, expect, it } from "vitest";
import { contactEmail, normalizeUsername, signInIdentity, usernameIdentity } from "@/lib/username";

describe("username authentication identifiers", () => {
  it("normalizes case and whitespace to the same unique login", () => {
    expect(usernameIdentity(" Dr_Priya ")).toBe("dr_priya@users.medscribe.invalid");
    expect(signInIdentity("DR_PRIYA")).toBe(usernameIdentity("dr_priya"));
  });
  it.each(["ab", "a".repeat(33), "dr.priya", "dr priya", "_doctor", "doctor@example.com", "डॉक्टर"])("rejects unsupported signup identifier %s", (value) => {
    expect(() => normalizeUsername(value)).toThrow();
  });
  it("keeps legacy email accounts accessible", () => {
    expect(signInIdentity(" Doctor@Example.com ")).toBe("doctor@example.com");
  });
  it("does not display internal login identifiers as contact email", () => {
    expect(contactEmail(usernameIdentity("doctor"))).toBe("");
    expect(contactEmail("doctor@example.com")).toBe("doctor@example.com");
    expect(contactEmail(null)).toBe("");
  });
});
