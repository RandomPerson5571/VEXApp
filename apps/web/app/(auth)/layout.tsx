export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#03070e] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      <div className="absolute inset-0 auth-bg-grid opacity-[0.06] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-5xl flex justify-center">
        {children}
      </div>
    </div>
  );
}
