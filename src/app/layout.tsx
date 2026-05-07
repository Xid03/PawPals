import type { Metadata, Viewport } from "next";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";
import { GuestLimitDialog } from "@/components/GuestLimitDialog";
import { getCurrentUserFromCookie } from "@/server/current-user";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawPals",
  description: "A cozy community for you and your cat",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#FFF6E9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUserFromCookie();

  return (
    <html lang="en">
      <body className="font-sans">
        <CurrentUserProvider initialUser={initialUser}>
          <main className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-paw-cream shadow-paw md:my-6 md:min-h-[860px] md:rounded-[2rem]">
            {children}
            <GuestLimitDialog />
          </main>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
