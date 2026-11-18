import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: { icon: "/institute/niper-emblem.png" },
  title: "NIPER-Raebareli Alumni Association",
  description: "The alumni community of NIPER-Raebareli. Reconnect with your batch, keep up with events, and support the association.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
