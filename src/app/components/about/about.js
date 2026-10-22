"use client";

import "./about.css";
import Image from "next/image";
import { useSession } from "../auth/sessionProvider";

import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();

  const { user, isLoadingUser } = useSession();

  function handleCommunityClick() {
    if (isLoadingUser) {
      return;
    }

    router.push(
      user ? "/profile" : "/register"
    );
  }

  return (
    <section
      id="about"
      className="about"
    >
      <Image className="about-background" src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=80" alt="" fill sizes="100vw" quality={75} loading="lazy" />
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
          onClick={handleCommunityClick}
          disabled={isLoadingUser}
        >
          Alătură-te comunității
        </button>
      </div>
    </section>
  );
}