import { z } from "zod";

/**
 * Twin Builds Lab content. The same idea is built twice (Twin A: a typical beginner prompt;
 * Twin B: a SeniorSeat Blueprint) and both face identical tests.
 *
 * Honesty rule (enforced here): an episode cannot be "published" without a measured value
 * for every required metric for BOTH twins, plus a link to the raw artifacts. The site never
 * shows a number that is not in a published episode.
 */

export const METRIC_IDS = [
  "p95-latency-ms",
  "error-rate-under-load",
  "security-findings-high",
  "exposed-secrets",
  "restore-minutes",
  "monthly-cost-100-users",
  "monthly-cost-10k-users",
  "lighthouse-performance",
  "lighthouse-accessibility",
  "prompts-used",
  "build-hours",
] as const;
export type MetricId = (typeof METRIC_IDS)[number];

export const MetricDefinitionSchema = z.strictObject({
  id: z.enum(METRIC_IDS),
  name: z.string().min(1),
  category: z.enum(["load", "security", "recovery", "cost", "quality", "effort"]),
  unit: z.string().min(1),
  betterWhen: z.enum(["lower", "higher"]),
  howMeasured: z.string().min(20),
  tool: z.string().min(1),
});
export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;

export const MethodologySchema = z.strictObject({
  version: z.number().int().positive(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rules: z.array(z.string().min(10)).min(1),
  metrics: z.array(MetricDefinitionSchema).length(METRIC_IDS.length),
});
export type Methodology = z.infer<typeof MethodologySchema>;

const TwinSchema = z.strictObject({
  label: z.string().min(1),
  approach: z.string().min(10),
  liveUrl: z.url().optional(),
  repoUrl: z.url().optional(),
});

const MeasurementSchema = z.strictObject({
  metric: z.enum(METRIC_IDS),
  twinA: z.number(),
  twinB: z.number(),
  note: z.string().optional(),
});

export const EpisodeSchema = z
  .strictObject({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    number: z.number().int().positive(),
    title: z.string().min(1),
    idea: z.string().min(20),
    tool: z.string().min(1),
    status: z.enum(["planned", "building", "testing", "published"]),
    methodologyVersion: z.number().int().positive(),
    twinA: TwinSchema,
    twinB: TwinSchema,
    measurements: z.array(MeasurementSchema).default([]),
    artifactsUrl: z.url().optional(),
    videoUrl: z.url().optional(),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    findings: z.array(z.string().min(10)).default([]),
  })
  .superRefine((ep, ctx) => {
    if (ep.status !== "published") {
      if (ep.measurements.length > 0 || ep.findings.length > 0) {
        ctx.addIssue({ code: "custom", message: "Only published episodes may carry measurements or findings.", path: ["measurements"] });
      }
      return;
    }
    const measured = new Set(ep.measurements.map((m) => m.metric));
    const missing = METRIC_IDS.filter((id) => !measured.has(id));
    if (missing.length > 0) {
      ctx.addIssue({ code: "custom", message: `Published episodes need every metric. Missing: ${missing.join(", ")}`, path: ["measurements"] });
    }
    if (!ep.artifactsUrl) ctx.addIssue({ code: "custom", message: "Published episodes need artifactsUrl (raw results).", path: ["artifactsUrl"] });
    if (!ep.publishedAt) ctx.addIssue({ code: "custom", message: "Published episodes need publishedAt.", path: ["publishedAt"] });
  });
export type Episode = z.infer<typeof EpisodeSchema>;
