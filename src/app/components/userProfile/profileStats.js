import "./userProfile.css";

import {
  SquarePen,
  Globe2,
  Heart,
  Users,
  UserPlus,
  Camera,
  Star,
} from "lucide-react";

export default function ProfileStats({ user }) {
  if (!user) {
    return null;
  }

  const stats = user.stats || {};

  const level =
    user.level && typeof user.level === "object"
      ? user.level
      : {};

  const currentXp = Number(level.currentXp) || 0;
  const nextLevelXp = Number(level.nextLevelXp) || 500;

  const progressPercent = Math.min(
    (currentXp / Math.max(nextLevelXp, 1)) * 100,
    100
  );

  const xpRemaining = Math.max(
    nextLevelXp - currentXp,
    0
  );

  const statItems = [
    {
      icon: SquarePen,
      value: Number(stats.postsCount) || 0,
      label: "Postări",
      type: "posts",
    },
    {
      icon: Globe2,
      value: Number(stats.destinationsCount) || 0,
      label: "Destinații",
      type: "destinations",
    },
    {
      icon: Heart,
      value: Number(stats.likesReceived) || 0,
      label: "Aprecieri",
      type: "likes",
    },
    {
      icon: Users,
      value: Number(stats.followersCount) || 0,
      label: "Urmăritori",
      type: "followers",
    },
    {
      icon: UserPlus,
      value: Number(stats.followingCount) || 0,
      label: "Urmărește",
      type: "following",
    },
    {
      icon: Camera,
      value: Number(stats.photosUploaded) || 0,
      label: "Fotografii",
      type: "photos",
    },
  ];

  return (
    <section className="travel-profile-stats-section">
      <div className="travel-profile-stats-grid">
        {statItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="travel-profile-stat-card"
              key={item.type}
            >
              <div
                className={`travel-profile-stat-icon travel-profile-stat-icon-${item.type}`}
              >
                <Icon
                  size={25}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>

              <strong>{item.value}</strong>

              <span>{item.label}</span>
            </article>
          );
        })}
      </div>

      <article className="travel-profile-level-card">
        <div className="travel-profile-level-icon">
          <Star
            size={34}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>

        <div className="travel-profile-level-info">
          <span>Nivel actual</span>

          <h3>
            {level.name || "Călător începător"}
          </h3>

          <p>
            Nivel {Number(level.number) || 1}
          </p>
        </div>

        <div className="travel-profile-xp-area">
          <div className="travel-profile-xp-top">
            <span>Progres experiență</span>

            <strong>
              {currentXp} / {nextLevelXp} XP
            </strong>
          </div>

          <div className="travel-profile-xp-track">
            <div
              className="travel-profile-xp-fill"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>

          <p className="travel-profile-xp-text">
            Mai ai <strong>{xpRemaining}</strong> XP
            până la următorul nivel.
          </p>
        </div>
      </article>
    </section>
  );
}