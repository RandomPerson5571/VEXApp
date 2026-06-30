import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
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
      className={cn("h-full dark", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
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
                document.documentElement.style.colorScheme = theme;
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
