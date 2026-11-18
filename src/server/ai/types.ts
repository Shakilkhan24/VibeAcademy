import "server-only";
import type { z } from "zod";

/**
 * The AI layer has one entry point (AiGateway.run) and two seams:
 *  - AiProvider: talks to a model vendor (or simulates one). Knows nothing about features.
 *  - AiFeature:  one product use of AI (e.g. X-Ray classification). Owns its prompt, schema,
 *                version and limits. Knows nothing about vendors.
 * Nothing else in the codebase may call a model.
 */

export interface StructuredRequest {
  feature: string;
  model: string;
  system: string;
  user: string;
  /** JSON Schema for the output (vendor structured-output format). */
  jsonSchema: Record<string, unknown>;
  maxOutputTokens: number;
  /** The feature's raw input, for simulated providers only. Real providers must ignore it. */
  input: unknown;
  signal: AbortSignal;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface StructuredResponse {
  json: unknown;
  usage: Usage;
  model: string;
}

export interface AiProvider {
  readonly name: "anthropic" | "simulated";
  generate(request: StructuredRequest): Promise<StructuredResponse>;
}

export interface AiFeature<TInput, TOutput> {
  key: string;
  /** Bump when the prompt or schema changes. Part of the cache key. */
  promptVersion: number;
  /** Extra version that invalidates cache entries (e.g. TAXONOMY_VERSION). */
  contentVersion: number;
  maxOutputTokens: number;
  cacheTtlSeconds: number;
  /** Model name resolved from configuration. */
  model(config: { models: { xray: string } }): string;
  system(): string;
  user(input: TInput): string;
  jsonSchema(): Record<string, unknown>;
  /** Validate and normalise raw model JSON. Throw to reject. */
  parse(raw: unknown): TOutput;
  /** Zod schema of the model output, kept for tests and documentation. */
  outputSchema: z.ZodType;
}

export type AiErrorCode =
  | "feature_disabled"
  | "provider_disabled"
  | "budget_exhausted"
  | "provider_unavailable"
  | "provider_error"
  | "timeout"
  | "refused"
  | "invalid_output";

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;
  readonly status?: number;
  /** Tokens consumed before the failure, so the ledger stays honest. */
  readonly usage?: Usage;

  constructor(code: AiErrorCode, message: string, opts: { retryable?: boolean; status?: number; usage?: Usage } = {}) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.retryable = opts.retryable ?? false;
    this.status = opts.status;
    this.usage = opts.usage;
  }
}
