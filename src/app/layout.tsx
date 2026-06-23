// 📂 Location: src/app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./providers"; // 🌟 Importing the SessionProvider wrapper
import "./globals.css";

// System font variables replace the external Google Fonts downloads
const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "LogiShield AI - Advanced Logistics Dashboard",
  description: "Automated carrier log ingestion and NLP risk analysis pipeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 🌟 Wrapping the children ensures both login, signup, and the dashboard have session context access */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}