import { describe, it, expect } from "vitest";
import { GET } from "@/app/llms.txt/route";
import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";

describe("llms.txt (generated from profile.ts - single-source invariant)", () => {
  it("serves plain text carrying identity, services, contact, and every FAQ", async () => {
    const res = GET();
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain(profile.name);
    expect(body).toContain(profile.email);
    expect(body).toContain(profile.bookingUrl);
    for (const s of profile.services) expect(body).toContain(s.title);
    for (const f of faq) expect(body).toContain(f.q);
  });
});
