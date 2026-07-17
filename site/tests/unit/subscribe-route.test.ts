import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// The route proxies to Buttondown via plain fetch — stub the global.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/subscribe/route";

function makeReq(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  }) as never;
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
    process.env.BUTTONDOWN_API_KEY = "bd_test_key";
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("silently accepts honeypot submissions without calling Buttondown", async () => {
    const res = await POST(makeReq({ email: "a@b.co", website: "spam.com" }, "8.8.8.1"));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid emails with 422", async () => {
    for (const bad of ["not-an-email", "", "a@b", `${"x".repeat(320)}@example.com`]) {
      const res = await POST(makeReq({ email: bad }, "8.8.8.2"));
      expect(res.status).toBe(422);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const req = new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "x-forwarded-for": "8.8.8.3" },
      body: "{not json",
    }) as never;
    expect((await POST(req)).status).toBe(400);
  });

  it("subscribes via Buttondown on the happy path", async () => {
    const res = await POST(makeReq({ email: "new@example.com" }, "8.8.8.4"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.buttondown.com/v1/subscribers");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Token bd_test_key" });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email_address: "new@example.com",
    });
  });

  it("treats already-subscribed as idempotent success", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "That email is already subscribed" }), { status: 400 }),
    );
    const res = await POST(makeReq({ email: "again@example.com" }, "8.8.8.5"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("treats a 400 with a NON-already-subscribed detail as a real failure (502)", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "email_address field is malformed" }), { status: 400 }),
    );
    const res = await POST(makeReq({ email: "weird@example.com" }, "8.8.8.10"));
    expect(res.status).toBe(502);
  });

  it("returns 503 when the API key is missing", async () => {
    delete process.env.BUTTONDOWN_API_KEY;
    const res = await POST(makeReq({ email: "a@example.com" }, "8.8.8.6"));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 with no vendor detail leaked when Buttondown is down", async () => {
    fetchMock.mockResolvedValue(new Response("internal secret trace", { status: 500 }));
    const res = await POST(makeReq({ email: "a@example.com" }, "8.8.8.7"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/buttondown|secret|500/i);
  });

  it("rate limits the 6th attempt from one IP within an hour", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await POST(makeReq({ email: `u${i}@example.com` }, "8.8.8.99"))).status).toBe(200);
    }
    expect((await POST(makeReq({ email: "u6@example.com" }, "8.8.8.99"))).status).toBe(429);
  });
});
