"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingSections } from "./LandingSections";
import { LandingIntegrations } from "./LandingIntegrations";
import { LandingFooter } from "./LandingFooter";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            ".landing-hero-brand",
            ".landing-hero-headline",
            ".landing-hero-sub",
            ".landing-hero-cta",
            ".landing-hero-mock",
            ".landing-section",
          ],
          { clearProps: "all", opacity: 1, y: 0 },
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
        heroTl
          .from(".landing-hero-brand", { opacity: 0, y: 20, duration: 0.6 })
          .from(
            ".landing-hero-headline",
            { opacity: 0, y: 28, duration: 0.7 },
            "-=0.35",
          )
          .from(
            ".landing-hero-sub",
            { opacity: 0, y: 20, duration: 0.55 },
            "-=0.4",
          )
          .from(
            ".landing-hero-cta",
            { opacity: 0, y: 16, duration: 0.5 },
            "-=0.35",
          )
          .from(
            ".landing-hero-mock",
            { opacity: 0, y: 40, duration: 0.8 },
            "-=0.3",
          );

        gsap.to(".landing-hero-mock", {
          y: -36,
          ease: "none",
          scrollTrigger: {
            trigger: ".landing-hero-mock",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        gsap.utils.toArray<HTMLElement>(".landing-section").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="landing-root relative min-h-screen bg-black text-zinc-100"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui" }}
    >
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
    </div>
  );
}
