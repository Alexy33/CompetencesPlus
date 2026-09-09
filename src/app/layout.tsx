import { cn } from "@/lib/utils";
import type { LayoutProps } from "@/types/pages";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "ProfilsActifs", template: "%s | ProfilsActifs" },
  description:
    "Valorisation des compétences par vidéo courte et évaluation des aptitudes professionnelles.",
  applicationName: "ProfilsActifs",
  openGraph: {
    type: "website",
    siteName: "ProfilsActifs",
    title: "ProfilsActifs",
    description:
      "Des profils professionnels enrichis par la vidéo et l'évaluation des compétences.",
  },
  twitter: {
    card: "summary",
    title: "ProfilsActifs",
    description:
      "Des profils professionnels enrichis par la vidéo et l'évaluation des compétences.",
  },
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="fr" className={cn(geistSans.variable, geistMono.variable)}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
