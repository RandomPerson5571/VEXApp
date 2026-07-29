import dynamic from "next/dynamic";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingFooter } from "./LandingFooter";
import { LandingMotion } from "./LandingMotion";

const LandingSections = dynamic(() =>
  import("./LandingSections").then((module) => module.LandingSections),
);

const LandingIntegrations = dynamic(() =>
  import("./LandingIntegrations").then(
    (module) => module.LandingIntegrations,
  ),
);

export function LandingPage() {
  return (
    <LandingMotion>
      <div className="landing-noise pointer-events-none fixed inset-0 z-[1]" />
      <div className="relative z-[2]">
        <LandingNav />
        <main>
          <LandingHero />
          <LandingSections />
          <LandingIntegrations />
          <LandingFooter />
        </main>
      </div>
    </LandingMotion>
  );
}
