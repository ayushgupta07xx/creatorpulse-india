import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import PulseMark from "@/components/PulseMark";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CreatorPulse — Creator economy intelligence for India",
  description:
    "Search Indian YouTube creators for growth, niche demand, and engagement quality — or brief a campaign and get a risk-screened shortlist.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-bg font-sans text-ink antialiased">
        <header className="relative z-30 border-b border-white/10">
          <div className="mx-auto flex max-w-wrap items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
            >
              <PulseMark size="sm" />
            </Link>
            <nav className="flex items-center gap-7 text-sm text-muted">
              <Link href="/creators" className="transition-colors hover:text-ink">
                Creators
              </Link>
              <Link href="/niches" className="transition-colors hover:text-ink">
                Niches
              </Link>
              <Link href="/brands" className="transition-colors hover:text-ink">
                Brands
              </Link>
              <Link href="/about" className="transition-colors hover:text-ink">
                About
              </Link>
            </nav>
          </div>
        </header>
        <main className="relative flex-1">{children}</main>
        <footer className="relative z-20 border-t border-white/10">
          <div className="mx-auto max-w-wrap px-6 py-6 text-sm text-muted">
            CreatorPulse · built by Ayush Gupta · data via the official YouTube
            Data API
          </div>
        </footer>
        <ChatWidget />
      </body>
    </html>
  );
}
