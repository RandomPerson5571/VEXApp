
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ROOT_LAYOUT_METADATA } from "@/lib/seo";
import { cn } from "@stlvex/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = ROOT_LAYOUT_METADATA;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full dark", "antialiased", geistSans.variable, geistMono.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" href="/logos/Robotics_lion.svg" as="image" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
              const theme = localStorage.getItem('theme') || 'dark';
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
              document.documentElement.style.colorScheme = theme;
            })();`}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <ServiceWorkerRegistration />
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
