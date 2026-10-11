import type { Metadata } from "next";
import "./globals.css";
import { appUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "TrueForm Excellence — Stays, Cars, Land, Houses & Insurance", template: "%s | TrueForm Excellence" },
  description:
    "Book short stays and rental cars, find land and houses for sale, and get insurance cover. Pay securely by card or mobile money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
