import { describe, expect, it } from "vitest";
import { createAnthropicProvider } from "@/server/ai/providers/anthropic";
import { AiError, type StructuredRequest } from "@/server/ai/types";

function request(): StructuredRequest {
  return {
    feature: "xray.classify",
    model: "claude-haiku-5-5",
    system: "system text",
    user: "<prompt>\nbuild a shop\n</prompt>",
    jsonSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
    maxOutputTokens: 100,
    input: { prompt: "build a shop" },
    signal: new AbortController().signal,
  };
}

function mockFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("Anthropic provider", () => {
  it("sends a structured-output request and parses the JSON text block", async () => {
    const { fetchImpl, calls } = mockFetch(200, {
      model: "claude-haiku-5-5",
      stop_reason: "end_turn",
      content: [{ type: "text", text: '{"ok":true}' }],
      usage: { input_tokens: 1234, output_tokens: 56 },
    });
    const provider = createAnthropicProvider({ apiKey: "sk-test", fetchImpl });
    const res = await provider.generate(request());

    expect(res).toEqual({ json: { ok: true }, usage: { inputTokens: 1234, outputTokens: 56 }, model: "claude-haiku-5-5" });
    expect(calls[0]!.url).toBe("https://api.anthropic.com/v1/messages");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-test");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse(String(calls[0]!.init.body));
    expect(body.output_config).toEqual({ format: { type: "json_schema", schema: request().jsonSchema } });
    expect(body.system).toBe("system text");
    expect(body.messages).toEqual([{ role: "user", content: request().user }]);
    expect(body).not.toHaveProperty("output_format"); // deprecated parameter
  });

  it("marks 429 and 5xx as retryable, 4xx as not", async () => {
    for (const [status, retryable] of [[429, true], [529, true], [500, true], [400, false]] as const) {
      const provider = createAnthropicProvider({ apiKey: "k", fetchImpl: mockFetch(status, {}).fetchImpl });
      const err = await provider.generate(request()).catch((e) => e);
      expect(err).toBeInstanceOf(AiError);
      expect(err.retryable, String(status)).toBe(retryable);
    }
  });

  it("reports refusals and truncation with the tokens they used", async () => {
    const refused = createAnthropicProvider({ apiKey: "k", fetchImpl: mockFetch(200, { stop_reason: "refusal", content: [], usage: { input_tokens: 10, output_tokens: 2 } }).fetchImpl });
    const e1 = await refused.generate(request()).catch((e) => e);
    expect(e1.code).toBe("refused");
    expect(e1.usage).toEqual({ inputTokens: 10, outputTokens: 2 });

    const cut = createAnthropicProvider({ apiKey: "k", fetchImpl: mockFetch(200, { stop_reason: "max_tokens", content: [{ type: "text", text: "{" }] }).fetchImpl });
    expect((await cut.generate(request()).catch((e) => e)).code).toBe("invalid_output");
  });

  it("rejects non-JSON text", async () => {
    const provider = createAnthropicProvider({ apiKey: "k", fetchImpl: mockFetch(200, { stop_reason: "end_turn", content: [{ type: "text", text: "not json" }] }).fetchImpl });
    expect((await provider.generate(request()).catch((e) => e)).code).toBe("invalid_output");
  });
});
