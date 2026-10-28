import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  applicationName: "OpenUni",
  title: {
    default: "OpenUni — University answers and academic dates",
    template: "%s | OpenUni",
  },
  description:
    "Ask questions about your university and get cited answers, or plan exams, deadlines, holidays and events with the academic calendar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <div className="app-shell">
          <SiteHeader />
          <div className="app-content">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
