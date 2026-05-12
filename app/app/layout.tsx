import type { Metadata } from "next";
import { Bebas_Neue, Inter_Tight } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pick5-beta.vercel.app"),
  title: {
    default: "Pick5 — No-loss fantasy on Celo",
    template: "%s · Pick5",
  },
  description:
    "Pick 5 Premier League players. Win the pool. Lose nothing. Built on Celo with an ERC-8004 verified AI Coach.",
  applicationName: "Pick5",
  openGraph: {
    title: "Pick5 — No-loss fantasy on Celo",
    description:
      "Pick 5 Premier League players. Win the pool. Lose nothing. Built on Celo with an ERC-8004 verified AI Coach.",
    siteName: "Pick5",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pick5 — No-loss fantasy on Celo",
    description:
      "Pick 5 Premier League players. Win the pool. Lose nothing.",
  },
  other: {
    // Talent App project domain-ownership verification
    "talentapp:project_verification":
      "35eedb8130b9842ac1819851a16dcab4169acbb311210fccca6e3b4c7f8dd3f78e04499b246e1ee8f0c877ac092703de7896c1ce4348596fb2e0cadbeee02891",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="bg-[#08070D] text-white min-h-full flex flex-col font-sans">
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
