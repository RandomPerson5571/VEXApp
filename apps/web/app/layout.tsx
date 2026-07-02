import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Inter } from "next/font/google";import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "STL VEX Robotics",
    template: "%s | STL VEX Robotics",
  },
  description:
    "Team hub for STL VEX Robotics. Manage matches, build logs, inventory, calendar, documents, and members for the 2026-2027 season.",
  keywords: [
    "VEX Robotics",
    "STL Robotics",
    "robotics team",
    "team management",
    "competition",
  ],
  authors: [{ name: "STL VEX Robotics" }],
  creator: "STL VEX Robotics",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "STL VEX Robotics",
    title: "STL VEX Robotics",
    description:
      "Team hub for STL VEX Robotics. Manage matches, build logs, inventory, calendar, documents, and members.",
  },
  twitter: {
    card: "summary",
    title: "STL VEX Robotics",
    description:
      "Team hub for STL VEX Robotics. Manage matches, build logs, inventory, calendar, documents, and members.",
  },
  icons: {
    icon: "/logos/Robotics_lion.svg",
    apple: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "STL VEX",
  },
  applicationName: "STL VEX Robotics",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#03070e" },
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
      className={cn("h-full dark", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        registrations.forEach(function(registration) { registration.unregister(); });
      });
    }
  }
  const theme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme = theme === 'light' || theme === 'dark' ? theme : prefersDark ? 'dark' : 'light';
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();`}
        </Script>
        <ServiceWorkerRegistration />        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
