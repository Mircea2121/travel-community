"use client";

import "./about.css";
import { useRouter } from "next/navigation";
export default function About() {
  const router = useRouter();
  return (
    <section
      id="about"
      className="about"
    >
      <div className="about-overlay" />

      <div className="about-content">
        <span className="about-badge">
          ✈️ Comunitatea Călătorilor
        </span>

        <h2>
          Fiecare vacanță merită
          <br />
          împărtășită.
        </h2>

    
        <p>
          Ne dorim să construim cea mai mare
          comunitate de călători din România,
          unde fiecare experiență reală îi poate
          ajuta pe ceilalți să ia decizii mai bune.
        </p>

        <p>
          Când vrei să pleci într-o destinație nouă,
          vrem să fii la doar un search distanță de
          toate informațiile importante:
          restaurante, obiective turistice,
          capcane, costuri și recomandări reale.
        </p>

        <button
          type="button"
          className="about-button"
          onClick={() => router.push("/login")}
        >
          Alătură-te comunității
        </button>
      </div>
    </section>
  );
}