"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Parolele nu coincid.");
      return;
    }

    console.log("User pregătit pentru baza de date:", {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    alert("Cont pregătit pentru creare. Urmează conectarea la baza de date.");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span>🌍 Travel Community</span>
          <h1>Creează cont</h1>
          <p>Intră în comunitate și postează experiențele tale de călătorie.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Numele tău"
            value={formData.name}
            onChange={handleChange}
            required
          />

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

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmă parola"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit">Creează cont</button>
        </form>

        <p className="auth-switch">
          Ai deja cont? <Link href="/login">Autentifică-te</Link>
        </p>
      </section>
    </main>
  );
}