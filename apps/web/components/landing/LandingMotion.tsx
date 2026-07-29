"use client";

import { useEffect, useRef } from "react";

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;

    const frame = requestAnimationFrame(async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !rootRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        const mm = gsap.matchMedia();

        mm.add("(prefers-reduced-motion: reduce)", () => {
          gsap.set(
            [".landing-hero-mock", ".landing-section"],
            { clearProps: "all", opacity: 1, y: 0 },
          );
        });

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from(".landing-hero-brand", { y: 12, duration: 0.45 })
            .from(".landing-hero-headline", { y: 18, duration: 0.55 }, "-=0.3")
            .from(".landing-hero-sub", { y: 12, duration: 0.4 }, "-=0.3")
            .from(".landing-hero-cta", { y: 10, duration: 0.35 }, "-=0.25")
            .from(".landing-hero-video", { scale: 0.98, duration: 0.5 }, "-=0.3")
            .from(".landing-hero-mock", { y: 24, duration: 0.6 }, "-=0.25");

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

        dispose = () => mm.revert();
      }, rootRef);

      const disposeMedia = dispose;
      dispose = () => {
        disposeMedia?.();
        context.revert();
      };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      dispose?.();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="landing-root relative min-h-screen bg-black text-zinc-100"
    >
      {children}
    </div>
  );
}
