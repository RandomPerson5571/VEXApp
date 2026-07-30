
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
              const accentTheme = localStorage.getItem('accent-theme') || 'orange';
              const customAccent = localStorage.getItem('custom-accent-color') || '#b65f2a';
              const fontSize = Number(localStorage.getItem('font-size') || '100');
              const normalizedFontSize = Math.min(Math.max(Math.round(Number.isFinite(fontSize) ? fontSize : 100), 90), 115);
              const accentColor = accentTheme === 'monochrome'
                ? '#a1a1aa'
                : accentTheme === 'custom' && /^#[0-9a-f]{6}$/i.test(customAccent)
                  ? customAccent
                  : '#ea580c';
              const red = parseInt(accentColor.slice(1, 3), 16);
              const green = parseInt(accentColor.slice(3, 5), 16);
              const blue = parseInt(accentColor.slice(5, 7), 16);
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
              document.documentElement.style.colorScheme = theme;
              document.documentElement.dataset.siteTheme =
                accentTheme === 'monochrome' || accentTheme === 'custom' ? accentTheme : 'orange';
              document.documentElement.style.setProperty('--site-accent', accentColor);
              document.documentElement.style.setProperty('--site-accent-rgb', red + ' ' + green + ' ' + blue);
              document.documentElement.style.fontSize = normalizedFontSize + '%';
            })();`}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <ServiceWorkerRegistration />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
