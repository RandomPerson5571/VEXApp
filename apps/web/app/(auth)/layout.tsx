export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#03070e] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(249,115,22,0.38),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.26),transparent_24%),radial-gradient(circle_at_50%_90%,rgba(234,88,12,0.34),transparent_34%)] animate-[authPageGlow_18s_ease-in-out_infinite] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(249,115,22,0.2),transparent_24%),radial-gradient(circle_at_70%_65%,rgba(251,146,60,0.18),transparent_22%)] blur-3xl animate-[authPageGlow_24s_ease-in-out_infinite] pointer-events-none" />
      <div className="absolute inset-0 auth-bg-grid opacity-[0.06] pointer-events-none" />
      <div className="relative z-10 w-full max-w-5xl flex justify-center">
        {children}
      </div>
    </div>
  );
}
