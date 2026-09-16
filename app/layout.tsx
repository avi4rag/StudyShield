import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans, Manrope } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/components/auth/AuthContext";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyShield | Early support for every learner",
  description: "A calm, intelligent early-warning system for learning teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${plusJakartaSans.variable} ${manrope.variable}`}>
      <body className={`${dmSans.className} antialiased font-sans`}>
        <SessionProvider>
          <AuthProvider>{children}</AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
