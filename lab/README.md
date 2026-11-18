# Twin Builds Lab harness

Scripts that produce every number in a Lab episode. Methodology and metric definitions: `content/lab/methodology.yaml` (also shown at `/lab`).

**Status:** written, not yet run against real twin builds (milestone M4). Treat as a starting point and fix anything the first real run reveals.

**Who runs it:** the founder, offline, with a coding agent such as Claude Code (prompt 5 in [docs/agent-prompts.md](../docs/agent-prompts.md)). The website never calls an AI API to produce comparisons; it only publishes the finished episode YAML and links to the raw artifacts.

## Per episode

1. Deploy both twins. Record their URLs in the episode YAML.
2. Run each check against both twins with identical settings:

| Metric | How | Command |
| --- | --- | --- |
| p95 latency, error rate | k6 ramp on the main flow | `TARGET_URL=https://twin-a.example k6 run lab/k6/main-flow.js --summary-export lab/results/raw/a-k6.json` |
| High-severity findings | ZAP baseline (passive) | `TARGET_URL=https://twin-a.example ./lab/zap/run-baseline.sh a` |
| Exposed secrets | gitleaks on the repo + bundle scan | `REPO_DIR=../twin-a TARGET_URL=https://twin-a.example ./lab/secrets/scan.sh a` |
| Two-user access | Manual script | Follow `lab/access-test/README.md`, record pass/fail per step |
| Lighthouse scores | Lighthouse CI, mobile, median of 3 | `npx @lhci/cli autorun --config=lab/lighthouse/lighthouserc.json --collect.url=https://twin-a.example` |
| Restore time | Stopwatch on video | Delete the production database, follow the twin's own docs, stop when the last order is served again |
| Monthly cost | Provider calculators | Record inputs and links in the episode notes |
| Prompts used, hours | Tool history export, time log | Attach exports |

3. Upload everything in `lab/results/raw/` (git-ignored) to a public location and set `artifactsUrl`.
4. Fill `measurements` for every metric, set `status: published` and `publishedAt`. `pnpm content:check` refuses incomplete episodes.

## Ethics

Only test deployments you own. ZAP runs in passive baseline mode only.
