import "server-only";
import { AiError, type AiProvider, type StructuredRequest, type StructuredResponse } from "../types";

/**
 * Anthropic Messages API with structured outputs (`output_config.format` = json_schema,
 * no beta header: https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
 *
 * Plain fetch instead of the SDK: one endpoint, full control over timeouts and retries
 * (the gateway owns those), trivial to mock in tests. Revisit if we need streaming.
 *
 * Never log request bodies: they contain the learner's prompt.
 */
export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface MessagesResponse {
  model?: string;
  stop_reason?: string;
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

export function createAnthropicProvider(opts: AnthropicProviderOptions): AiProvider {
  const baseUrl = (opts.baseUrl ?? "https://api.anthropic.com").replace(/\/$/, "");
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    name: "anthropic",
    async generate(req: StructuredRequest): Promise<StructuredResponse> {
      let res: Response;
      try {
        res = await fetchImpl(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": opts.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: req.model,
            max_tokens: req.maxOutputTokens,
            system: req.system,
            messages: [{ role: "user", content: req.user }],
            output_config: { format: { type: "json_schema", schema: req.jsonSchema } },
          }),
          signal: req.signal,
        });
      } catch (error) {
        if (req.signal.aborted) throw new AiError("timeout", "The AI provider did not answer in time.", { retryable: true });
        throw new AiError("provider_unavailable", `Could not reach the AI provider: ${error instanceof Error ? error.message : "network error"}`, { retryable: true });
      }

      if (!res.ok) {
        // 429 rate limit, 5xx and 529 overloaded are worth one retry; 4xx are our bug.
        const retryable = res.status === 429 || res.status >= 500;
        throw new AiError(retryable ? "provider_unavailable" : "provider_error", `AI provider returned HTTP ${res.status}.`, { retryable, status: res.status });
      }

      const body = (await res.json()) as MessagesResponse;
      const usage = { inputTokens: body.usage?.input_tokens ?? 0, outputTokens: body.usage?.output_tokens ?? 0 };

      if (body.stop_reason === "refusal") throw new AiError("refused", "The model declined to analyse this prompt.", { usage });
      if (body.stop_reason === "max_tokens") throw new AiError("invalid_output", "The model's answer was cut off.", { usage });

      const text = body.content?.find((b) => b.type === "text")?.text;
      if (!text) throw new AiError("invalid_output", "The model returned no text.", { usage });
      try {
        return { json: JSON.parse(text), usage, model: body.model ?? req.model };
      } catch {
        throw new AiError("invalid_output", "The model returned invalid JSON.", { usage });
      }
    },
  };
}
