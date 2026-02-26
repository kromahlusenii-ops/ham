import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hamprotocol.com"),
  title: "HAM — Hierarchical Agent Memory",
  description:
    "Scoped memory files that cut context bloat by 50%. Fewer tokens, lower cost, smaller carbon footprint.",
  keywords: [
    "AI memory",
    "agent memory",
    "token optimization",
    "scoped memory",
    "developer tools",
  ],
  openGraph: {
    title: "HAM — Hierarchical Agent Memory",
    description:
      "Scoped memory files that cut context bloat by 50%.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
