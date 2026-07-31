import "./userProfile.css";

import {
  SquarePen,
  Heart,
  Users,
  UserPlus,
  Camera,
  Medal,
  Compass,
  Mountain,
  Gem,
  Crown,
} from "lucide-react";

const LEVELS = {
  1: {
    icon: Medal,
    name: "Călător începător",
    minimumXp: 0,
    nextLevelXp: 400,
  },

  2: {
    icon: Compass,
    name: "Explorator",
    minimumXp: 400,
    nextLevelXp: 900,
  },

  3: {
    icon: Mountain,
    name: "Aventurier",
    minimumXp: 900,
    nextLevelXp: 1600,
  },

  4: {
    icon: Gem,
    name: "Maestru al călătoriilor",
    minimumXp: 1600,
    nextLevelXp: 2600,
  },

  5: {
    icon: Crown,
    name: "Călător veteran",
    minimumXp: 2600,
    nextLevelXp: null,
  },
};

export default function ProfileStats({ user }) {
  if (!user) {
    return null;
  }

  const stats = user.stats || {};

  const backendLevel =
    user.level &&
    typeof user.level === "object"
      ? user.level
      : {};

  const rawLevelNumber =
    Number(backendLevel.number) || 1;

  const levelNumber = Math.min(
    Math.max(rawLevelNumber, 1),
    5
  );

  const levelDetails =
    LEVELS[levelNumber] || LEVELS[1];

  const LevelIcon =
    levelDetails.icon || Medal;

  const currentXp = Math.max(
    Number(backendLevel.currentXp) || 0,
    0
  );

  const isMaximumLevel =
    levelNumber === 5;

  const levelMinimumXp =
    levelDetails.minimumXp;

  const nextLevelXp =
    levelDetails.nextLevelXp;

  const xpEarnedInCurrentLevel =
    Math.max(
      currentXp - levelMinimumXp,
      0
    );

  const xpRequiredForCurrentLevel =
    isMaximumLevel
      ? 1
      : Math.max(
          nextLevelXp -
            levelMinimumXp,
          1
        );

  const progressPercent =
    isMaximumLevel
      ? 100
      : Math.min(
          Math.max(
            (
              xpEarnedInCurrentLevel /
              xpRequiredForCurrentLevel
            ) *
              100,
            0
          ),
          100
        );

  const xpRemaining =
    isMaximumLevel
      ? 0
      : Math.max(
          nextLevelXp - currentXp,
          0
        );

  const nextLevel =
    !isMaximumLevel
      ? LEVELS[levelNumber + 1]
      : null;

  const NextLevelIcon =
    nextLevel?.icon || Medal;

  const statItems = [
    {
      icon: SquarePen,
      value:
        Number(
          stats.postsCount
        ) || 0,
      label: "Postări",
      type: "posts",
    },

    {
      icon: Heart,
      value:
        Number(
          stats.likesReceived
        ) || 0,
      label: "Aprecieri",
      type: "likes",
    },

    {
      icon: Users,
      value:
        Number(
          stats.followersCount
        ) || 0,
      label: "Urmăritori",
      type: "followers",
    },

    {
      icon: UserPlus,
      value:
        Number(
          stats.followingCount
        ) || 0,
      label: "Urmărește",
      type: "following",
    },

    {
      icon: Camera,
      value:
        Number(
          stats.photosUploaded
        ) || 0,
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

              <strong>
                {item.value}
              </strong>

              <span>
                {item.label}
              </span>
            </article>
          );
        })}
      </div>

      <article
        className={`travel-profile-level-card travel-profile-level-card-${levelNumber}`}
      >
        <div
          className={`travel-profile-level-icon travel-profile-level-icon-${levelNumber}`}
          aria-hidden="true"
        >
          <LevelIcon
            size={34}
            strokeWidth={2}
          />
        </div>

        <div className="travel-profile-level-info">
          <span>
            Nivel actual
          </span>

          <h3>
            {levelDetails.name}
          </h3>

          <p>
            Nivel {levelNumber}
          </p>
        </div>

        <div className="travel-profile-xp-area">
          <div className="travel-profile-xp-top">
            <span>
              {isMaximumLevel
                ? "Experiență totală"
                : "Progres experiență"}
            </span>

            <strong>
              {isMaximumLevel
                ? `${currentXp} XP`
                : `${currentXp} / ${nextLevelXp} XP`}
            </strong>
          </div>

          <div
            className="travel-profile-xp-track"
            role="progressbar"
            aria-label="Progres nivel"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(
              progressPercent
            )}
          >
            <div
              className="travel-profile-xp-fill"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>

          {isMaximumLevel ? (
            <p className="travel-profile-xp-text">
              Ai atins nivelul maxim:{" "}

              <strong
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Crown
                  size={16}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />

                Călător veteran
              </strong>
              .
            </p>
          ) : (
            <p className="travel-profile-xp-text">
              Mai ai{" "}

              <strong>
                {xpRemaining}
              </strong>{" "}

              XP până la{" "}

              <strong
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <NextLevelIcon
                  size={16}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />

                {nextLevel.name}
              </strong>
              .
            </p>
          )}
        </div>
      </article>
    </section>
  );
}