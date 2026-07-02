"use client";

import { useRouter, useSearchParams } from "next/navigation";
import "./userProfile.css";

const PUBLIC_TABS = [
  { key: "posts", label: "Postări", icon: "✍️" },
  { key: "destinations", label: "Destinații", icon: "🌍" },
  { key: "about", label: "Despre", icon: "👤" },
];

const PRIVATE_TABS = [{ key: "saved", label: "Salvate", icon: "❤️" }];

export default function ProfileTabs({ isOwnProfile = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") || "posts";
  const tabs = isOwnProfile ? [...PUBLIC_TABS, ...PRIVATE_TABS] : PUBLIC_TABS;

  function handleTabChange(tabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);

    router.push(`?${params.toString()}`, {
      scroll: false,
    });
  }

  return (
    <nav className="profile-tabs" aria-label="Navigare profil">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`profile-tab ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => handleTabChange(tab.key)}
        >
          <span className="profile-tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}