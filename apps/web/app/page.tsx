import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import RoaryIcon from "@/components/roaryicon.png";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "VEX Team Hub for Competition Season",
  description: SITE_DESCRIPTION,
  path: "/",
});

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
      description: SITE_DESCRIPTION,
      logo: `${getSiteUrl()}/icon.png`,
    },
  ],
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  if (params) {
    const code = params.code;

    if (typeof code === "string" && code.trim()) {
      const target = new URL("/auth/callback", "https://stlvexapp.guanine.org");

      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "string" && value) {
          target.searchParams.set(key, value);
        } else if (Array.isArray(value)) {
          target.searchParams.set(key, value.join(","));
        }
      }

      redirect(target.toString());
    }
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <main className="min-h-screen font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#ffa800] text-[#1a1200]">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                Welcome to STL Robotics
              </h1>
              <p className="mt-4 text-lg text-[#3a2800]/80 max-w-xl">
                Roary keeps match prep, knowledge graph, calendar updates, and member coordination in one place for your VRC season.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <p className="inline-flex items-center gap-3 rounded-full bg-[#1a1200]/10 border border-[#1a1200]/20 text-[#3a2800] font-semibold px-6 py-3">
                  <Image src={RoaryIcon} alt="" width={20} height={20} className="h-5 w-5" />
                  Ask your team lead for an invite link
                </p>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1a1200]/25 px-5 py-3 text-[#1a1200] font-semibold hover:bg-white/20"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-10 lg:mt-0 lg:ml-10 flex-shrink-0 group relative h-[550px] w-[550px]">
              <Image
                src={RoaryIcon}
                alt="Roary, STL Robotics team mascot"
                priority
                className="h-full w-auto object-contain transition-opacity duration-1000 ease-out group-hover:opacity-0 float"
              />
              <video
                src="/models/wow.mp4"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Looping STL Robotics video"
                className="absolute inset-0 h-full w-full object-contain transition-opacity duration-1000 ease-out opacity-0 group-hover:opacity-100 float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#0b0f16] text-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-extrabold mb-6">Built for competition season</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0f1720]/60 p-6 hover-lift hover:border-slate-600 hover:bg-[#0f1720]/80">
              <h3 className="font-bold text-lg">Match Readiness</h3>
              <p className="mt-2 text-sm text-slate-400">Track upcoming matches, scouting notes, and the details your drive team needs before queueing.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0f1720]/60 p-6 hover-lift hover:border-slate-600 hover:bg-[#0f1720]/80">
              <h3 className="font-bold text-lg">Team Coordination</h3>
              <p className="mt-2 text-sm text-slate-400">Keep members, roles, invites, and permissions organized as the roster changes through the season.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0f1720]/60 p-6 hover-lift hover:border-slate-600 hover:bg-[#0f1720]/80">
              <h3 className="font-bold text-lg">Build Resources</h3>
              <p className="mt-2 text-sm text-slate-400">Centralize knowledge, schedules, and team resources so the whole team can find what matters fast.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
