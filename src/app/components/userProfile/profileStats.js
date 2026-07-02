import "./userProfile.css";

export default function ProfileStats({ user }) {
  if (!user) return null;

  const stats = user.stats || {};
  const nextLevel = user.nextLevel;

  const currentScore = nextLevel?.currentScore || 0;
  const pointsNeeded = nextLevel?.pointsNeeded || 0;
  const totalForNextLevel = currentScore + pointsNeeded || 2000;

  const progressPercent = Math.min(
    (currentScore / totalForNextLevel) * 100,
    100
  );

  const statItems = [
    {
      icon: "✍️",
      value: stats.postsCount || 0,
      label: "Postări",
    },
    {
      icon: "🌍",
      value: stats.destinationsCount || 0,
      label: "Destinații",
    },
    {
      icon: "❤️",
      value: stats.likesReceived || 0,
      label: "Like-uri",
    },
    {
      icon: "👥",
      value: stats.followers || 0,
      label: "Followers",
    },
    {
      icon: "➡️",
      value: stats.following || 0,
      label: "Following",
    },
    {
      icon: "📸",
      value: user.photosUploaded || 0,
      label: "Fotografii",
    },
  ];

  return (
    <section className="travel-profile-stats-section">
      <div className="travel-profile-stats-grid">
        {statItems.map((item) => (
          <article className="travel-profile-stat-card" key={item.label}>
            <div className="travel-profile-stat-icon">{item.icon}</div>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>

      <article className="travel-profile-level-card">
        <div className="travel-profile-level-icon">⭐</div>

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
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="travel-profile-xp-text">
            Mai ai <strong>{pointsNeeded}</strong> XP până la{" "}
            <strong>{nextLevel?.nextLevel || "următorul nivel"}</strong>.
          </p>
        </div>
      </article>
    </section>
  );
}