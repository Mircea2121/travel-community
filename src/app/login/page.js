"use client";

import { useState } from "react";
import Link from "next/link";
import "../auth/auth.css";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Autentificare:", formData);

    alert("Urmează conectarea la baza de date.");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span>🌍 Travel Community</span>

          <h1>Autentificare</h1>

          <p>
            Conectează-te pentru a posta experiențe, fotografii și recenzii.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Parolă"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit">
            Autentifică-te
          </button>
        </form>

        <p className="auth-switch">
          Nu ai cont?{" "}
          <Link href="/register">
            Creează unul
          </Link>
        </p>
      </section>
    </main>
  );
}