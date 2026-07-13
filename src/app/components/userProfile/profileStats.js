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
  if (!user) return null;

  const stats = user.stats || {};
  const nextLevel = user.nextLevel;

  const currentScore = nextLevel?.currentScore || 0;
  const pointsNeeded = nextLevel?.pointsNeeded || 0;

  const totalForNextLevel =
    currentScore + pointsNeeded || 2000;

  const progressPercent = Math.min(
    (currentScore / totalForNextLevel) * 100,
    100
  );

  const statItems = [
    {
      icon: SquarePen,
      value: stats.postsCount || 0,
      label: "Postări",
      type: "posts",
    },
    {
      icon: Globe2,
      value: stats.destinationsCount || 0,
      label: "Destinații",
      type: "destinations",
    },
    {
      icon: Heart,
      value: stats.likesReceived || 0,
      label: "Aprecieri",
      type: "likes",
    },
    {
      icon: Users,
      value: stats.followers || 0,
      label: "Urmăritori",
      type: "followers",
    },
    {
      icon: UserPlus,
      value: stats.following || 0,
      label: "Urmărește",
      type: "following",
    },
    {
      icon: Camera,
      value: user.photosUploaded || 0,
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
              key={item.label}
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

          <h3>{user.level}</h3>

          <p>Nivel 4</p>
        </div>

        <div className="travel-profile-xp-area">
          <div className="travel-profile-xp-top">
            <span>Progres experiență</span>

            <strong>
              {currentScore} / {totalForNextLevel} XP
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
            Mai ai <strong>{pointsNeeded}</strong> XP până la{" "}
            <strong>
              {nextLevel?.nextLevel || "următorul nivel"}
            </strong>
            .
          </p>
        </div>
      </article>
    </section>
  );
}