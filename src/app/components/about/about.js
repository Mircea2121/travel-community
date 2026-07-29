"use client";

import "./about.css";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [isLoadingUser, setIsLoadingUser] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (isMounted) {
            setUser(null);
          }

          return;
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (data?.success && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

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