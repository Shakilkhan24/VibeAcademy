import { ImageResponse } from "next/og";
import { getAppContext } from "@/server/context";
import { getSharedSummary } from "@/server/services/xray";
import { SCORE_BANDS } from "@/domain/xray/scoring";

export const runtime = "nodejs";
export const alt = "A VibeAcademy Prompt X-Ray result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card: score, band and silent-decision count. Never the prompt. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getAppContext();
  const summary = await getSharedSummary(ctx, slug);
  const band = summary ? SCORE_BANDS.find((b) => b.id === summary.band)?.label ?? "" : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0f2d4e",
          backgroundImage: "linear-gradient(rgba(232,239,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(232,239,246,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          color: "#e8eff6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, color: "#a7bcd1" }}>VibeAcademy Prompt X-Ray</div>
        {summary ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <span style={{ fontSize: 180, fontWeight: 700, lineHeight: 1 }}>{summary.score}</span>
              <span style={{ fontSize: 56, color: "#a7bcd1" }}>/100</span>
              <span style={{ fontSize: 56, color: "#f2c14e", marginLeft: 24 }}>{band}</span>
            </div>
            <div style={{ display: "flex", fontSize: 44, marginTop: 24 }}>{`${summary.silentCount} decisions left to the AI`}</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 64 }}>Every prompt hides decisions.</div>
        )}
        <div style={{ display: "flex", fontSize: 30, color: "#a7bcd1" }}>Vibe like a beginner. Decide like a senior.</div>
      </div>
    ),
    size,
  );
}
