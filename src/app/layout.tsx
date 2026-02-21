import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/auth/AuthGuard";
import { SettingsProvider } from "@/components/providers/SettingsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DS Gallery | Media Management",
  description: "Centralized media management platform for office products",
  icons: {
    icon: "/logo-v2.jpg",
    shortcut: "/logo-v2.jpg",
    apple: "/logo-v2.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased custom-scrollbar`}
      >
        <SettingsProvider>
          <AuthGuard>{children}</AuthGuard>
        </SettingsProvider>
      </body>
    </html>
  );
}
