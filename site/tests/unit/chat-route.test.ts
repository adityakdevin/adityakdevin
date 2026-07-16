import { describe, it, expect, vi, beforeEach } from "vitest";

const streamMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { stream: streamMock };
  },
}));

import { POST } from "@/app/api/chat/route";
import { costUsd } from "@/lib/cost";
import { buildSystemPrompt } from "@/lib/prompt";

type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

const tinyUsage: Usage = {
  input_tokens: 300,
  cache_read_input_tokens: 20_000,
  cache_creation_input_tokens: 0,
  output_tokens: 200,
};

function makeStream(chunks: string[], opts: { failAfter?: number; usage?: Usage } = {}) {
  return {
    async *[Symbol.asyncIterator]() {
      let i = 0;
      for (const text of chunks) {
        if (opts.failAfter !== undefined && i >= opts.failAfter) {
          throw new Error("anthropic 529: overloaded sk-secret");
        }
        i += 1;
        yield { type: "content_block_delta", delta: { type: "text_delta", text } };
      }
    },
    async finalMessage() {
      return { usage: opts.usage ?? tinyUsage };
    },
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
    expect(p).not.toMatch(/sk-ant|api[_-]?key|ANTHROPIC/i);
  });
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    streamMock.mockReset();
    streamMock.mockImplementation(() => makeStream(["Aditya ", "builds ", "things."]));
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
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
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("returns 503 unconfigured when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(makeReq({ message: "who is aditya?" }, "8.8.8.3"));
    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe("unconfigured");
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("streams the answer with the cached corpus prompt and a 500-token cap", async () => {
    const res = await POST(makeReq({ message: "who is aditya?" }, "8.8.8.4"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("Aditya builds things.");

    const params = streamMock.mock.calls[0][0];
    expect(params.model).toBe("claude-haiku-4-5");
    expect(params.max_tokens).toBe(500);
    expect(params.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(params.system[0].text).toContain("Aditya Kumar");
  });

  it("ends a mid-stream failure with a friendly line, never a frozen cursor", async () => {
    streamMock.mockImplementation(() => makeStream(["Aditya is a ", "Tech Lead"], { failAfter: 1 }));
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
    streamMock.mockImplementation(() =>
      makeStream(["expensive answer"], {
        usage: { input_tokens: 0, output_tokens: 3_000_000 }, // $15 > $10 cap
      }),
    );
    const first = await POST(makeReq({ message: "big one" }, "8.8.8.7"));
    expect(first.status).toBe(200);
    await first.text(); // stream completes → spend recorded

    const second = await POST(makeReq({ message: "after the cap" }, "8.8.8.8"));
    expect(second.status).toBe(503);
    expect((await second.json()).reason).toBe("budget");
    expect(streamMock).toHaveBeenCalledTimes(1); // no LLM call past the cap
  });
});
