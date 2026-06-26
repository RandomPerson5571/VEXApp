import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#03070e] text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-extrabold mb-4">Welcome to STL Robotics
        <p className="text-lg text-slate-300 mb-6">Your VEX event management dashboard.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard" className="block rounded-lg border border-slate-900 bg-[#090e18]/80 px-6 py-6 hover:bg-[#0b1220]">
            <h2 className="font-bold text-slate-100">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-400">View events, teams, and matches.</p>
          </Link>

          <Link href="/join" className="block rounded-lg border border-slate-900 bg-[#090e18]/80 px-6 py-6 hover:bg-[#0b1220]">
            <h2 className="font-bold text-slate-100">Join by Invite</h2>
            <p className="mt-1 text-sm text-slate-400">Use an invite link to create an account.</p>
          </Link>
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <p>Need help? Visit the docs or contact support.</p>
        </div>
      </div>
    </main>
  );
}
