import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import PublicNav from "@/components/layout/PublicNav";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "FanPass | Watch The Game With Your Crew",
  description: "FanPass is where football fans buy tickets to watch the game live alongside their favourite TikTok football influencer and community.",
  manifest: "/manifest.json",
  themeColor: "#1A7A4A",
  appleWebApp: {
    statusBarStyle: "default",
    title: "FanPass",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/192.png" />
      </head>
      <body className={`${dmSans.variable} ${outfit.variable} antialiased`}>
        <Providers>
          <PublicNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
