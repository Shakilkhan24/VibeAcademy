import { ImageResponse } from "next/og";

export function learningImage(title: string, context: string) {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", backgroundColor: "#0f2d4e", color: "#e8eff6", padding: 64, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", fontSize: 34, color: "#f2c14e" }}>VibeAcademy</div>
      <div style={{ display: "flex", fontSize: 70, lineHeight: 1.12 }}>{title}</div>
      <div style={{ display: "flex", borderTop: "2px solid #a7bcd1", paddingTop: 20, color: "#a7bcd1", fontSize: 30 }}>{context}</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
