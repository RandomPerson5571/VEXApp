import Image from "next/image";

const INTEGRATIONS = [
  { name: "Discord", src: "/logos/discord-icon.svg" },
  { name: "GitHub", src: "/logos/github-icon.svg" },
  { name: "Fusion 360", src: "/logos/fusion360-icon.svg" },
] as const;

export function LandingIntegrations() {
  return (
    <section className="landing-section border-t border-[#1a1a1a] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-sm font-medium tracking-wide text-[#ffa800]">
          Connected tools
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Works with the stack you already use
        </h2>
        <p className="mx-auto mt-3 max-w-md text-zinc-400">
          Link Discord, GitHub, and Fusion so notifications and project context
          stay with the team.
        </p>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
          {INTEGRATIONS.map((item) => (
            <li
              key={item.name}
              className="flex flex-col items-center gap-3 text-sm text-zinc-400"
            >
              <span className="flex size-14 items-center justify-center rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
                <Image
                  src={item.src}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              </span>
              {item.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
