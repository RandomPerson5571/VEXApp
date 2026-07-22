"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 80);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out",
        hidden ? "-translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <div className="border-b border-[#1a1a1a]/80 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logos/Robotics_lion.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              STL Robotics
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="landing-orange-glass-button rounded-md px-3 py-1.5 text-sm font-medium"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
