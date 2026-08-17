import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayoutRenderer } from "@/components/layout/ClientLayoutRenderer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Eyevengers | Perfect Vision & Style",
  description: "Shop the trendiest frames this season at Eyevengers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ClientLayoutRenderer>
          {children}
        </ClientLayoutRenderer>
      </body>
    </html>
  );
}
