import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/ui/site-header";


const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "prod.ai | Music production and theory",
  description: "Music theory, production guidance, and original MIDI sketches.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full", "font-sans", geist.variable)}>
      <body className="flex min-h-full flex-col bg-[#c0c0c0] text-[#101010]">
        <div className="desktop-shell flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
