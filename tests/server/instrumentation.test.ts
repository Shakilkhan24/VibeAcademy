import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestError } from "@/instrumentation";

afterEach(() => vi.restoreAllMocks());

describe("server request failure reporting", () => {
  it.each([
    ["/x/[slug]/page", "x"],
    ["/open/page", "open"],
    ["/page", "home"],
    ["/an-unrecognised-section", "other"],
  ])("reports a fixed area for %s", async (routePath, area) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await onRequestError(new Error("private exception text"), {
      method: "GET", path: "/x/example-share?note=personal", headers: { cookie: "test-session" },
    }, { routerKind: "App Router", routePath, routeType: "render", revalidateReason: undefined });

    expect(log).toHaveBeenCalledExactlyOnceWith(expect.any(String));
    expect(JSON.parse(log.mock.calls[0]![0])).toEqual({
      event: "server_request_failure", timestamp: expect.any(String), area, kind: "render",
    });
  });
});
