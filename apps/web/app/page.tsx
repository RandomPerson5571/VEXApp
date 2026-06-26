import Link from "next/link";
import Image from "next/image";
import RoaryIcon from "@/components/roaryicon.png";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0f16] font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#ffa800] text-[#1a1200]">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                Welcome to STL Robotics
              </h1>
              <p className="mt-4 text-lg text-[#3a2800]/80 max-w-xl">
                Roary keeps match prep, team documents, calendar updates, and member coordination in one place for the STL VEX Robotics season.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-3 rounded-full bg-[#1a1200] text-white font-semibold px-6 py-3 shadow-lg hover:bg-[#2b1d00]"
                >
                  <Image src={RoaryIcon} alt="" width={20} height={20} className="h-5 w-5" />
                  Join by Invite
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1a1200]/25 px-5 py-3 text-[#1a1200] font-semibold hover:bg-white/20"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-10 lg:mt-0 lg:ml-10 flex-shrink-0">
              <div className="flex h-56 w-96 max-w-full items-center justify-center">
                <Image
                  src={RoaryIcon}
                  alt="Roary"
                  priority
                  className="h-full w-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#0b0f16] text-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-extrabold mb-6">Built for competition season</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0f1720]/60 p-6">
              <h3 className="font-bold text-lg">Match Readiness</h3>
              <p className="mt-2 text-sm text-slate-400">Track upcoming matches, scouting notes, and the details your drive team needs before queueing.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0f1720]/60 p-6">
              <h3 className="font-bold text-lg">Team Coordination</h3>
              <p className="mt-2 text-sm text-slate-400">Keep members, roles, invites, and permissions organized as the roster changes through the season.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0f1720]/60 p-6">
              <h3 className="font-bold text-lg">Build Resources</h3>
              <p className="mt-2 text-sm text-slate-400">Centralize documents, schedules, and team resources so the whole team can find what matters fast.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
