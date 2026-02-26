import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "HAM — Hierarchical Agent Memory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const fontsDir = join(process.cwd(), "src/app/fonts");
  const [manropeBold, ibmPlexMono] = await Promise.all([
    readFile(join(fontsDir, "Manrope-Bold.ttf")),
    readFile(join(fontsDir, "IBMPlexMono-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#1c1917",
          padding: "60px 80px",
          fontFamily: "Manrope",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "IBM Plex Mono",
            fontSize: 14,
            color: "#3eb489",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Hierarchical Agent Memory
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          HAM
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 28,
            color: "#d6d3d1",
            lineHeight: 1.4,
            marginBottom: 32,
          }}
        >
          <div>Fewer tokens.</div>
          <div>Lower cost.</div>
          <div>Greener AI.</div>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 64,
            height: 3,
            backgroundColor: "#3eb489",
            borderRadius: 2,
            marginBottom: 24,
          }}
        />

        {/* Stat */}
        <div
          style={{
            fontFamily: "IBM Plex Mono",
            fontSize: 16,
            color: "#a8a29e",
          }}
        >
          50% fewer tokens per prompt
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Manrope", data: manropeBold, weight: 700 },
        { name: "IBM Plex Mono", data: ibmPlexMono, weight: 400 },
      ],
    }
  );
}
