// k6 load test for a twin's main flow. Run: TARGET_URL=https://... k6 run lab/k6/main-flow.js
// Edit PATHS per episode to match the app's main user flow (read-only requests by default).
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.TARGET_URL;
const TARGET_VUS = Number(__ENV.TARGET_VUS || 200);
const PATHS = (__ENV.PATHS || "/").split(",");

export const options = {
  stages: [
    { duration: "1m", target: Math.round(TARGET_VUS / 4) },
    { duration: "3m", target: TARGET_VUS },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  for (const path of PATHS) {
    const res = http.get(`${BASE}${path}`);
    check(res, { "status is 2xx/3xx": (r) => r.status >= 200 && r.status < 400 });
  }
  sleep(1);
}
