"use client";

import { useEffect, useRef, useState } from "react";
import { useCommunityOverview } from "@/app/components/discovery/communityOverviewProvider";
import "./stats.css";

function AnimatedNumber({ value, shouldStart }) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    if (!shouldStart) return;
    const from = previousValue.current;
    const difference = value - from;
    const start = performance.now();
    let frame;
    const update = (now) => {
      const progress = Math.min((now - start) / 700, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + difference * eased));
      if (progress < 1) frame = requestAnimationFrame(update);
      else previousValue.current = value;
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [shouldStart, value]);

  return displayValue.toLocaleString("ro-RO");
}

export default function Stats() {
  const sectionRef = useRef(null);
  const [shouldStart, setShouldStart] = useState(false);
  const { data, isLoading } = useCommunityOverview();
  const stats = [
    { value: data.stats.activeMembers, label: "Membri activi acum" },
    { value: data.stats.accountsCreated, label: "Conturi create" },
    { value: data.stats.postsPublished, label: "Postari publicate" },
    { value: data.stats.countriesCount, label: "Tari diferite" },
  ];

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShouldStart(true); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="stats-section" aria-label="Statistici comunitate">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <h2>{isLoading ? "—" : <AnimatedNumber value={stat.value} shouldStart={shouldStart} />}</h2>
          <p>{stat.label}</p>
        </article>
      ))}
    </section>
  );
}
