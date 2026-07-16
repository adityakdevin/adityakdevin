import { describe, it, expect, vi, beforeEach } from "vitest";

const streamTextMock = vi.hoisted(() => vi.fn());
vi.mock("ai", () => ({ streamText: streamTextMock }));

import { POST } from "@/app/api/chat/route";
import { costUsd } from "@/lib/cost";
import { buildSystemPrompt } from "@/lib/prompt";

type Usage = { inputTokens: number; outputTokens: number };

const tinyUsage: Usage = { inputTokens: 2000, outputTokens: 200 };

function makeResult(chunks: string[], opts: { failAfter?: number; usage?: Usage } = {}) {
  return {
    textStream: (async function* () {
      let i = 0;
      for (const text of chunks) {
        if (opts.failAfter !== undefined && i >= opts.failAfter) {
          throw new Error("gateway 529: overloaded sk-secret");
        }
        i += 1;
        yield text;
      }
    })(),
    usage: Promise.resolve(opts.usage ?? tinyUsage),
  };
}

function makeReq(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  }) as never;
}

describe("lib/cost costUsd", () => {
  it("prices Haiku tokens correctly", () => {
    expect(costUsd({ input_tokens: 1_000_000, output_tokens: 0 })).toBe(1);
    expect(costUsd({ input_tokens: 0, output_tokens: 1_000_000 })).toBe(5);
    expect(
      costUsd({
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 1_000_000,
        cache_creation_input_tokens: 1_000_000,
      }),
    ).toBeCloseTo(1.35);
  });
});

describe("lib/prompt buildSystemPrompt", () => {
  it("carries the corpus facts and the persona rules", () => {
    const p = buildSystemPrompt();
    expect(p).toContain("Aditya Kumar");
    expect(p).toContain("MM Nova Tech");
    expect(p).toContain("cal.com/adityakdevin");
    expect(p).toContain("BudgetGen");
    expect(p).toContain("Do you work with international clients?");
    expect(p).toMatch(/only answer questions about Aditya|only questions about Aditya/i);
  });

  it("contains no secrets or env values", () => {
    const p = buildSystemPrompt();
    expect(p).not.toMatch(/sk-ant|api[_-]?key|GATEWAY|OIDC/i);
  });
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    streamTextMock.mockReset();
    streamTextMock.mockImplementation(() => makeResult(["Aditya ", "builds ", "things."]));
    process.env.AI_GATEWAY_API_KEY = "vck_test";
    delete process.env.VERCEL_OIDC_TOKEN;
  });

  it("rejects malformed JSON with 400", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "x-forwarded-for": "8.8.8.1" },
      body: "{not json",
    }) as never;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects empty and >300-char messages with 422", async () => {
    for (const message of ["", "   ", "x".repeat(301)]) {
      const res = await POST(makeReq({ message }, "8.8.8.2"));
      expect(res.status).toBe(422);
    }
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("returns 503 unconfigured when no gateway credential exists", async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    const res = await POST(makeReq({ message: "who is aditya?" }, "8.8.8.3"));
    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe("unconfigured");
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("accepts ambient VERCEL_OIDC_TOKEN as the credential", async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.VERCEL_OIDC_TOKEN = "eyJ.test.jwt";
    const res = await POST(makeReq({ message: "who is aditya?" }, "8.8.8.9"));
    expect(res.status).toBe(200);
  });

  it("streams the answer with the corpus prompt and a 500-token cap via the gateway", async () => {
    const res = await POST(makeReq({ message: "who is aditya?" }, "8.8.8.4"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("Aditya builds things.");

    const params = streamTextMock.mock.calls[0][0];
    expect(params.model).toBe("anthropic/claude-haiku-4.5");
    expect(params.maxOutputTokens).toBe(500);
    expect(params.system).toContain("Aditya Kumar");
    expect(params.prompt).toBe("who is aditya?");
  });

  it("ends a mid-stream failure with a friendly line, never a frozen cursor", async () => {
    streamTextMock.mockImplementation(() => makeResult(["Aditya is a ", "Tech Lead"], { failAfter: 1 }));
    const res = await POST(makeReq({ message: "role?" }, "8.8.8.5"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Aditya is a ");
    expect(text).toContain("connection hiccup");
    expect(text).not.toContain("sk-secret"); // vendor errors never reach the client
  });

  it("rate limits the 11th question from one IP within an hour", async () => {
    const ip = "8.8.8.6";
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeReq({ message: `q${i}` }, ip));
      expect(res.status).toBe(200);
      await res.text(); // drain so spend is recorded deterministically
    }
    const res = await POST(makeReq({ message: "one more" }, ip));
    expect(res.status).toBe(429);
    expect((await res.json()).reason).toBe("rate");
  });

  // LAST on purpose: trips the module-level monthly spend counter for good.
  it("hard-refuses once the monthly $10 spend cap is hit", async () => {
    streamTextMock.mockImplementation(() =>
      makeResult(["expensive answer"], {
        usage: { inputTokens: 0, outputTokens: 3_000_000 }, // $15 > $10 cap
      }),
    );
    const first = await POST(makeReq({ message: "big one" }, "8.8.8.7"));
    expect(first.status).toBe(200);
    await first.text(); // stream completes → spend recorded

    const second = await POST(makeReq({ message: "after the cap" }, "8.8.8.8"));
    expect(second.status).toBe(503);
    expect((await second.json()).reason).toBe("budget");
    expect(streamTextMock).toHaveBeenCalledTimes(1); // no LLM call past the cap
  });
});
