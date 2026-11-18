/**
 * Tab-scoped storage for the X-Ray. sessionStorage can be unavailable (private modes,
 * embedded previews), so every access is guarded and failures are ignored.
 *
 * - DRAFT_KEY: a prompt handed from the home page to /xray. Read once, then removed.
 * - LAST_RESULT_KEY: the last result (never the prompt), so a refresh keeps the owner token.
 */
export const DRAFT_KEY = "seniorseat:xray-draft";
export const LAST_RESULT_KEY = "seniorseat:xray-last";

export function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the in-memory state still works */
  }
}
