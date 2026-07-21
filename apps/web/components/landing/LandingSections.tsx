const SECTIONS = [
  {
    num: "01",
    title: "Match readiness",
    body: "Track upcoming matches, scouting notes, and the details your drive team needs before queueing.",
    fragment: (
      <div className="space-y-2 text-sm">
        {["Alliance notes locked", "Auton path reviewed", "Battery check"].map(
          (row, i) => (
            <div
              key={row}
              className="flex items-center justify-between rounded-md border border-[#1a1a1a] bg-black/40 px-3 py-2"
            >
              <span className="text-zinc-300">{row}</span>
              <span className={i === 0 ? "text-[#ffa800]" : "text-zinc-600"}>
                {i === 0 ? "Ready" : "Queued"}
              </span>
            </div>
          ),
        )}
      </div>
    ),
  },
  {
    num: "02",
    title: "Team coordination",
    body: "Keep members, roles, invites, and permissions organized as the roster changes through the season.",
    fragment: (
      <div className="space-y-2 text-sm">
        {[
          ["Alex Chen", "Lead"],
          ["Jordan Lee", "Builder"],
          ["Sam Rivera", "Scout"],
        ].map(([name, role]) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-md border border-[#1a1a1a] bg-black/40 px-3 py-2"
          >
            <span className="text-zinc-300">{name}</span>
            <span className="text-zinc-500">{role}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "03",
    title: "Knowledge & scouting",
    body: "Connect build knowledge and opponent notes so the whole team can find what matters fast.",
    fragment: (
      <div className="relative h-36 overflow-hidden rounded-md border border-[#1a1a1a] bg-black/40">
        <div className="absolute left-1/4 top-1/3 size-3 rounded-full bg-[#ffa800]" />
        <div className="absolute left-1/2 top-1/2 size-2.5 rounded-full bg-zinc-400" />
        <div className="absolute right-1/4 top-1/4 size-2.5 rounded-full bg-zinc-500" />
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <line
            x1="28%"
            y1="38%"
            x2="50%"
            y2="52%"
            stroke="#2a2a2a"
            strokeWidth="1"
          />
          <line
            x1="50%"
            y1="52%"
            x2="72%"
            y2="30%"
            stroke="#2a2a2a"
            strokeWidth="1"
          />
        </svg>
        <p className="absolute bottom-3 left-3 text-xs text-zinc-500">
          Knowledge graph
        </p>
      </div>
    ),
  },
  {
    num: "04",
    title: "Calendar & tasks",
    body: "See the next event, day plans, and assignable work without switching tools mid-build.",
    fragment: (
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
        {Array.from({ length: 14 }, (_, i) => (
          <div
            key={i}
            className={[
              "aspect-square rounded border border-[#1a1a1a] bg-black/40 leading-[2.4rem]",
              i === 9 ? "border-[#ffa800]/50 text-[#ffa800]" : "",
            ].join(" ")}
          >
            {i + 1}
          </div>
        ))}
      </div>
    ),
  },
] as const;

export function LandingSections() {
  return (
    <section className="border-t border-[#1a1a1a] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-sm font-medium tracking-wide text-[#ffa800]">
          Built for purpose
        </p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Everything the season asks for, in one system
        </h2>

        <div className="mt-16 space-y-20 sm:space-y-28">
          {SECTIONS.map((s, i) => (
            <article
              key={s.num}
              className="landing-section grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <span className="font-mono text-xs text-zinc-600">{s.num}</span>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-zinc-400">
                  {s.body}
                </p>
              </div>
              <div
                className={[
                  "rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5",
                  i % 2 === 1 ? "lg:order-1" : "",
                ].join(" ")}
              >
                {s.fragment}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
