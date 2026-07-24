"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import UserProfile from "../../components/userProfile/userProfile";

export default function UserPage() {
  const params = useParams();

  const username =
    typeof params?.username === "string"
      ? params.username.trim().toLowerCase()
      : "";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      try {
        setLoading(true);
        setError("");

        if (!username) {
          throw new Error(
            "Username-ul utilizatorului lipsește."
          );
        }

        const response = await fetch(
          `/api/users/${encodeURIComponent(username)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "Profilul utilizatorului nu a putut fi încărcat."
          );
        }

        if (!data?.user) {
          throw new Error(
            "Datele profilului lipsesc."
          );
        }

        if (!isMounted) {
          return;
        }

        setUser({
          ...data.user,
          isOwnProfile:
            data.isOwnProfile === true,
          isFollowing:
            data.isFollowing === true,
        });
      } catch (fetchError) {
        console.error(
          "Eroare la încărcarea profilului public:",
          fetchError
        );

        if (!isMounted) {
          return;
        }

        setUser(null);
        setError(
          fetchError?.message ||
            "A apărut o eroare la încărcarea profilului."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [username]);

  if (loading) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-loading">
          <p>Se încarcă profilul...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-error">
          <h2>
            Profilul nu a putut fi încărcat
          </h2>

          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-error">
          <h2>Utilizator indisponibil</h2>

          <p>
            Nu am găsit profilul solicitat.
          </p>
        </div>
      </main>
    );
  }

  return <UserProfile user={user} />;
}