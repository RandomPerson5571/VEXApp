import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="landing-section border-t border-[#1a1a1a]">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
        <Image
          src="/logos/Robotics_lion.svg"
          alt=""
          width={40}
          height={40}
          className="mx-auto h-10 w-10"
        />
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Ready when your invite arrives
        </h2>
        <p className="mx-auto mt-3 max-w-md text-zinc-400">
          Ask your team lead for an invite link, then log in to open the
          season hub.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-md bg-[#ffa800] px-5 py-2.5 text-sm font-semibold text-[#1a1200] transition-colors hover:bg-[#ffb52e]"
          >
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-[#2a2a2a] px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-white/5"
          >
            Open Dashboard
          </Link>
        </div>
      </div>

      <div className="border-t border-[#1a1a1a] py-6 text-center text-xs text-zinc-600">
        STL Robotics · 2026–2027 Season · Roary
      </div>
    </footer>
  );
}
