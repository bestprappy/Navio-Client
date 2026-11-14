"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Bookmark, CalendarDays, PlugZap } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";
import { journey, photoCredits, productViews } from "./home.data";
import styles from "./home.module.css";

const icons = { places: Bookmark, plan: CalendarDays, ev: PlugZap };

export function HomeExperience() {
  const root = useRef<HTMLElement>(null);
  const steps = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = steps.current;
    if (!container) return;
    // Measure the actual stop centers: text wrapping changes each row's height.
    const connectStops = () => {
      const svg = container.querySelector("svg[data-route-svg]");
      const stops = [...container.querySelectorAll<HTMLElement>("[data-route-stop]")];
      const box = container.getBoundingClientRect();
      const centers = stops.map(stop => {
        const rect = stop.getBoundingClientRect();
        return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
      });
      if (!svg || centers.length < 2) return;
      svg.setAttribute("viewBox", `0 0 60 ${container.offsetHeight}`);
      let path = `M${centers[0].x} ${centers[0].y}`;
      centers.slice(1).forEach((point, index) => {
        const previous = centers[index];
        const bend = index % 2 === 0 ? 24 : -24;
        const gap = (point.y - previous.y) / 3;
        path += ` C${previous.x + bend} ${previous.y + gap} ${point.x + bend} ${point.y - gap} ${point.x} ${point.y}`;
      });
      svg.querySelectorAll("path").forEach(line => line.setAttribute("d", path));
    };
    const observer = new ResizeObserver(connectStops);
    observer.observe(container);
    connectStops();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-home-intro]", { y: 22, opacity: 0, stagger: 0.1, duration: 0.85, ease: "power3.out" });
      gsap.to("[data-home-photo]", { y: -65, rotation: 0, ease: "none", scrollTrigger: { trigger: "[data-home-hero]", start: "top top", end: "bottom top", scrub: 1 } });
      gsap.fromTo("[data-home-product]", { scale: 0.92, rotationX: 6 }, { scale: 1, rotationX: 0, ease: "none", scrollTrigger: { trigger: "[data-home-product]", start: "top bottom", end: "top 18%", scrub: 0.8 } });
      gsap.fromTo("[data-home-route]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: "[data-home-journey]", start: "top 65%", end: "bottom 70%", scrub: 0.5 } });
    }, root);
    return () => media.revert();
  }, []);

  return (
    <main ref={root} className={styles.home} id="main-content">
      <section className={styles.hero} data-home-hero aria-labelledby="home-title">
        <svg className={styles.heroRoute} viewBox="0 0 1440 650" fill="none" aria-hidden="true"><path d="M-80 440C170 600 360 470 300 300S65 175 145 360 600 610 840 390 1090 60 1220 140 1210 450 1500 260" /></svg>
        <figure className={cn(styles.postcard, styles.postcardLeft)} data-home-photo>
          <Image src="/images/plan-covers/chiang-mai.webp" alt="Temple in Chiang Mai" width={210} height={260} sizes="210px" />
          <figcaption>Chiang Mai, Thailand</figcaption>
        </figure>
        <figure className={cn(styles.postcard, styles.postcardRight)} data-home-photo>
          <Image src="/images/plan-covers/kyoto-spring.webp" alt="Cherry blossoms in Kyoto" width={210} height={260} sizes="210px" />
          <figcaption>Kyoto, Japan</figcaption>
        </figure>
        <div className={styles.heroCopy}>
          <p className={styles.intro} data-home-intro>A little planning. A lot to look forward to.</p>
          <h1 id="home-title" data-home-intro>Make room<br />for the trip.</h1>
          <p className={styles.lead} data-home-intro>The places you’ve saved. The stops along the way.<br className={styles.desktopBreak} /> Bring them together in a plan that’s yours.</p>
          <div className={styles.actions} data-home-intro>
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), styles.primary)}>Start planning <ArrowUpRight aria-hidden="true" /></Link>
            <Link href="/explore" className={cn(buttonVariants({ variant: "outline", size: "lg" }), styles.secondary)}>Explore trips</Link>
          </div>
          <a href="#discover" className={styles.scrollCue}>Take a look around <ArrowDown size={15} aria-hidden="true" /></a>
        </div>
      </section>

      <section id="discover" className={styles.product} aria-label="Discover Navio">
        <Tabs defaultValue="plans">
          <TabsList className={styles.tabs} aria-label="Explore features">
            {productViews.map(view => <TabsTrigger key={view.id} value={view.id} className={styles.tab}>{view.label}</TabsTrigger>)}
          </TabsList>
          {productViews.map(view => <TabsContent key={view.id} value={view.id}>
            <div className={styles.productFrame} data-home-product>
              <figure>
                <Image src={view.image} alt={view.alt} width={1152} height={850} sizes="(max-width: 768px) 94vw, 1120px" priority={view.id === "plans"} />
                <figcaption className={styles.productCaption}><span>Product screenshot · {view.label}</span><Link href={view.href}>Open Explore <ArrowUpRight size={16} aria-hidden="true" /></Link></figcaption>
              </figure>
            </div>
            <div className={styles.productDescription}>
            <h2>{view.title}</h2><div><p>{view.description}</p><Link className={styles.textLink} href={view.href}>{view.action} <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
            </div>
          </TabsContent>)}
        </Tabs>
      </section>

      <section id="features" className={styles.journey} data-home-journey aria-labelledby="journey-title">
        <div className={styles.journeyHeading}><p>Your trip, coming together</p><h2 id="journey-title">From “let’s go”<br />to “we’re here.”</h2><p>Ideas, itineraries, and the details in between.<br />Keep them in the same place.</p><Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), styles.journeyButton)}>Create your trip <ArrowUpRight aria-hidden="true" /></Link></div>
        <div ref={steps} className={styles.journeySteps} id="how-it-works">
          <svg data-route-svg viewBox="0 0 60 600" preserveAspectRatio="none" className={styles.journeyRoute} aria-hidden="true"><path d="M29 42V500" className={styles.routeBase} /><path pathLength="1" strokeDasharray="1" data-home-route d="M29 42V500" /></svg>
          {journey.map(item => { const Icon = icons[item.icon]; return <article key={item.title}><span data-route-stop className={styles.stepIcon}><Icon aria-hidden="true" size={22} /></span><h3>{item.title}</h3><p>{item.description}</p></article>; })}
        </div>
      </section>

      <section className={styles.outro} aria-labelledby="outro-title">
        <div className={styles.destinationImage}><Image src="/images/plan-covers/bled.webp" alt="Lake Bled and the surrounding mountains in Slovenia" fill sizes="(max-width: 768px) 100vw, 50vw" /></div>
        <div className={styles.outroCopy}><p>Leave a little room for the unexpected.</p><h2 id="outro-title">Where are<br />you off to?</h2><p>Start with an idea. The rest can take shape as you go.</p><Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), styles.primary)}>Plan a trip <ArrowUpRight aria-hidden="true" /></Link></div>
      </section>
      <details className={styles.credits}>
        <summary>Photography credits</summary>
        <p>Destination photos are cropped to fit. Product screenshots show Navio’s public Explore pages.</p>
        <ul>{photoCredits.map(photo => <li key={photo.sourceUrl}><a href={photo.sourceUrl}>{photo.subject}</a> — {photo.author}. <a href={photo.licenseUrl}>{photo.license}</a>.</li>)}</ul>
      </details>
    </main>
  );
}
