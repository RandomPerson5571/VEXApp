import Link from "next/link";
import { ShieldOff } from "lucide-react";

export function UnauthorizedFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-slate-900 bg-[#090e18]/80 p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <ShieldOff className="h-7 w-7 text-red-400" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          403 Unauthorized
        </p>
        <h1 className="mt-2 text-xl font-black text-slate-100">Access denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          This area is restricted to platform administrators. Contact an admin if
          you believe you should have access.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
