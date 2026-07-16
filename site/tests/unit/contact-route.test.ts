import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// The route sends via plain fetch to Mailtrap — stub the global.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/contact/route";

function makeReq(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  }) as never;
}

const valid = { name: "Test Person", email: "test@example.com", message: "Hello, I need a Laravel AI chatbot built." };

describe("POST /api/contact", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, message_ids: ["m1"] }), { status: 200 }),
    );
    process.env.MAILTRAP_API_TOKEN = "mt_test_token";
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("silently accepts honeypot submissions without sending", async () => {
    const res = await POST(makeReq({ ...valid, website: "spam.com" }, "9.9.9.1"));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid fields with 422", async () => {
    for (const bad of [
      { ...valid, name: "x" },
      { ...valid, email: "not-an-email" },
      { ...valid, message: "short" },
    ]) {
      const res = await POST(makeReq(bad, "9.9.9.2"));
      expect(res.status).toBe(422);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.3" },
      body: "{not json",
    }) as never;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("sends via Mailtrap and returns ok on the happy path", async () => {
    const res = await POST(makeReq(valid, "9.9.9.4"));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://send.api.mailtrap.io/api/send");
    expect(init.headers["Api-Token"]).toBe("mt_test_token");
    const sent = JSON.parse(init.body);
    expect(sent.reply_to.email).toBe(valid.email);
    expect(sent.text).toContain(valid.message);
    expect(sent.from.email).toBe("contact@adityadev.in");
  });

  it("returns 502 without leaking details when Mailtrap fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: false, errors: ["token mt-secret invalid"] }), { status: 401 }),
    );
    const res = await POST(makeReq(valid, "9.9.9.5"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("mt-secret");
    expect(JSON.stringify(body)).not.toContain("mailtrap");
  });

  it("returns 502 when the network call itself throws", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    const res = await POST(makeReq(valid, "9.9.9.8"));
    expect(res.status).toBe(502);
  });

  it("returns 503 when MAILTRAP_API_TOKEN is missing", async () => {
    delete process.env.MAILTRAP_API_TOKEN;
    const res = await POST(makeReq(valid, "9.9.9.6"));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate limits the 6th message from one IP within an hour", async () => {
    const ip = "9.9.9.7";
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeReq(valid, ip));
      expect(res.status).toBe(200);
    }
    const res = await POST(makeReq(valid, ip));
    expect(res.status).toBe(429);
  });
});
