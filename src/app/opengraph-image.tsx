import { ImageResponse } from "next/og";

export const alt = "Shohay — every gift, accounted for";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 88, background: "#174335", color: "white", fontFamily: "serif" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#b9dbc4" }}>Shohay<span style={{ color: "#ef765f" }}>.</span></div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>
          <span>Give quietly.</span>
          <span>See the good clearly.</span>
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 30, fontFamily: "sans-serif", color: "#ffffffaa" }}>A transparent, privacy-first charity record for Bangladesh.</div>
      </div>
    ),
    size,
  );
}
