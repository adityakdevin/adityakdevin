import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

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
    sendMock.mockReset();
    sendMock.mockResolvedValue({ error: null });
    process.env.RESEND_API_KEY = "re_test_key";
  });

  it("silently accepts honeypot submissions without sending", async () => {
    const res = await POST(makeReq({ ...valid, website: "spam.com" }, "9.9.9.1"));
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
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
    expect(sendMock).not.toHaveBeenCalled();
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

  it("sends via Resend and returns ok on the happy path", async () => {
    const res = await POST(makeReq(valid, "9.9.9.4"));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const arg = sendMock.mock.calls[0][0];
    expect(arg.replyTo).toBe(valid.email);
    expect(arg.text).toContain(valid.message);
  });

  it("returns 502 without leaking details when Resend fails", async () => {
    sendMock.mockRejectedValue(new Error("resend exploded: key sk-secret"));
    const res = await POST(makeReq(valid, "9.9.9.5"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("sk-secret");
    expect(JSON.stringify(body)).not.toContain("resend");
  });

  it("returns 503 when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await POST(makeReq(valid, "9.9.9.6"));
    expect(res.status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
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
