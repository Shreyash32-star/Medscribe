import { describe, expect, it } from "vitest";
import { MockStructuringService } from "@/lib/services/structuring";
import { DEMO_SEGMENTS } from "@/lib/demo";

describe("note structuring safety", () => {
  it("never populates Doctor Assessment or Doctor Plan", async () => {
    const out = (await new MockStructuringService().structure(DEMO_SEGMENTS)) as Record<string, unknown>;
    expect(out).not.toHaveProperty("doctor_assessment");
    expect(out).not.toHaveProperty("doctor_plan");
    expect(out).not.toHaveProperty("vitals");
  });

  it("only uses text that appears in the transcript", async () => {
    const out = await new MockStructuringService().structure(DEMO_SEGMENTS);
    const source = DEMO_SEGMENTS.map((s) => s.text).join(" ");
    for (const value of Object.values(out)) {
      for (const line of value!.split("\n")) {
        const quoted = line.replace(/^“|”$/g, "");
        expect(source).toContain(quoted.split(" ").slice(0, 4).join(" "));
      }
    }
  });

  it("returns nothing for an empty transcript", async () => {
    expect(await new MockStructuringService().structure([])).toEqual({});
  });
});
