import type { Metadata } from "next";
import "./globals.css";
import { activePreset } from "@/lib/core";

export const metadata: Metadata = {
  title: "Fly and whale watch | Harbour Air day trips",
  description:
    "Fly Vancouver to Victoria by seaplane, spend the afternoon with the whales, and fly home the same day. One booking covers all three legs.",
  metadataBase: new URL("https://tour.harbourair.com"),
  icons: {
    icon: "https://harbourair.com/favicon.ico",
    shortcut: "https://harbourair.com/favicon.ico",
    apple: "https://harbourair.com/favicon.ico",
  },
  openGraph: {
    title: "Whales for lunch. Home for dinner.",
    description:
      "Seaplane to Victoria, whale watching on the Salish Sea, seaplane home. One booking.",
    siteName: "Harbour Air day trips",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const font = activePreset();
  return (
    <html
      lang="en"
      style={
        {
          "--font-display": font.display,
          "--font-body": font.body,
          "--font-display-weight": font.displayWeight,
          "--font-display-tracking": font.displayTracking,
        } as React.CSSProperties
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={font.googleHref} rel="stylesheet" />
      </head>
      <body className="bg-white font-sans text-navy antialiased">{children}</body>
    </html>
  );
}
