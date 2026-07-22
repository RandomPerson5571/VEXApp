import Link from "next/link";
import Image from "next/image";
import { ProductMock } from "./ProductMock";

const heroVideoSrc =
  "/models/AQMxiHaYP_SQOFi7Oqbx5GRSZqZaPlPsh9oOPbBCfBwT7O_V0t8seGsqPndySK76bppQWPzx_CjuGJ2sChPKj1rxamC1koxGhfw91vs.mp4";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,168,0,0.14), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-16">
          <div>
            <div className="landing-hero-brand flex items-center gap-3">
              <Image
                src="/logos/Robotics_lion.svg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
                priority
              />
              <p className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                STL Robotics
              </p>
            </div>

            <h1 className="landing-hero-headline mt-6 max-w-3xl text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-zinc-50">
              The team hub for competition season
            </h1>

            <p className="landing-hero-sub mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Roary keeps match prep, knowledge, calendar, and member
              coordination in one place for the 2026-2027 VRC season.
            </p>

            <div className="landing-hero-cta mt-8 flex flex-wrap items-center gap-3">
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
              <p className="w-full text-sm text-zinc-500 sm:ml-1 sm:w-auto">
                Ask your team lead for an invite link
              </p>
            </div>
          </div>

          <div className="landing-hero-video hidden justify-self-center sm:block lg:justify-self-end">
            <video
              className="h-auto w-full max-w-[360px] rounded-lg object-contain lg:max-w-[420px]"
              src={heroVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="STL Robotics team hub preview video"
            />
            <p className="mt-3 text-center text-xs text-zinc-600">
              © 2026 STL Robotics
            </p>
          </div>
        </div>

        <div className="landing-hero-mock mt-14 sm:mt-16">
          <ProductMock />
        </div>
      </div>
    </section>
  );
}
