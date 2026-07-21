"use client";

import { useEffect, useRef, useState } from "react";
import "./stats.css";

const statsData = [
  {
    value: 12500,
    suffix: "+",
    label: "Membri activi",
  },
  {
    value: 850,
    suffix: "+",
    label: "Destinații explorate",
  },
  {
    value: 3200,
    suffix: "+",
    label: "Experiențe publicate",
  },
  {
    value: 98,
    suffix: "%",
    label: "Călători mulțumiți",
  },
];

function AnimatedNumber({
  value,
  suffix = "",
  shouldStart,
  duration = 1200,
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasAnimated.current) {
      return;
    }

    hasAnimated.current = true;

    const startTime = performance.now();
    let animationFrameId;

    const updateNumber = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(value * easedProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(updateNumber);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [shouldStart, value, duration]);

  return (
    <>
      {displayValue.toLocaleString("ro-RO")}
      {suffix}
    </>
  );
}

export default function Stats() {
  const sectionRef = useRef(null);
  const [shouldStart, setShouldStart] = useState(false);

  useEffect(() => {
    const sectionElement = sectionRef.current;

    if (!sectionElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldStart(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.25,
      }
    );

    observer.observe(sectionElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="stats-section">
      {statsData.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <h2>
            <AnimatedNumber
              value={stat.value}
              suffix={stat.suffix}
              shouldStart={shouldStart}
            />
          </h2>

          <p>{stat.label}</p>
        </article>
      ))}
    </section>
  );
}