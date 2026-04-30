import type { Metadata, Viewport } from "next";
import { GuestLimitDialog } from "@/components/GuestLimitDialog";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawPals",
  description: "A cozy community for you and your cat"
};

export const viewport: Viewport = {
  themeColor: "#FFF6E9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <main className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-paw-cream shadow-paw md:my-6 md:min-h-[860px] md:rounded-[2rem]">
          {children}
          <GuestLimitDialog />
        </main>
      </body>
    </html>
  );
}
