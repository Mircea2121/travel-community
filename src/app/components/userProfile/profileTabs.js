"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  PenLine,
} from "lucide-react";

import "./userProfile.css";

const PUBLIC_TABS = [
  {
    key: "posts",
    label: "Postări",
    icon: PenLine,
  },
];

const PRIVATE_TABS = [
  {
    key: "saved",
    label: "Salvate",
    icon: Bookmark,
  },
];

export default function ProfileTabs({
  isOwnProfile = false,
  activeTab = "posts",
  onTabChange,
}) {
  const [selectedTab, setSelectedTab] =
    useState(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  const tabs = isOwnProfile
    ? [...PUBLIC_TABS, ...PRIVATE_TABS]
    : PUBLIC_TABS;

  function handleTabChange(tabKey) {
    setSelectedTab(tabKey);

    if (typeof onTabChange === "function") {
      onTabChange(tabKey);
    }
  }

  return (
    <nav
      className="profile-tabs"
      aria-label="Navigare profil"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          selectedTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            className={`profile-tab ${
              isActive ? "active" : ""
            }`}
            onClick={() =>
              handleTabChange(tab.key)
            }
            aria-current={
              isActive ? "page" : undefined
            }
          >
            <Icon
              className="profile-tab-icon"
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
