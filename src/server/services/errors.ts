import "server-only";

export type ServiceErrorCode =
  | "invalid_input"
  | "feature_disabled"
  | "analysis_unavailable"
  | "rate_limited"
  | "budget_exhausted"
  | "not_found"
  | "forbidden"
  | "upstream_error";

const STATUS: Record<ServiceErrorCode, number> = {
  invalid_input: 400,
  forbidden: 403,
  not_found: 404,
  rate_limited: 429,
  feature_disabled: 503,
  analysis_unavailable: 503,
  budget_exhausted: 503,
  upstream_error: 502,
};

/** An error whose message is safe to show to the visitor. */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(code: ServiceErrorCode, message: string, opts: { retryAfterSeconds?: number } = {}) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.status = STATUS[code];
    this.retryAfterSeconds = opts.retryAfterSeconds;
  }
}
