import "./skeleton.css";

export function FeedSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-feed-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article
          className="skeleton-post-card"
          key={`feed-skeleton-${index}`}
        >
          <div className="skeleton-post-header">
            <div className="skeleton skeleton-avatar" />

            <div className="skeleton-post-user">
              <div className="skeleton skeleton-line skeleton-line-name" />
              <div className="skeleton skeleton-line skeleton-line-small" />
            </div>
          </div>

          <div className="skeleton skeleton-image" />

          <div className="skeleton-post-content">
            <div className="skeleton skeleton-line skeleton-line-title" />
            <div className="skeleton skeleton-line skeleton-line-full" />
            <div className="skeleton skeleton-line skeleton-line-medium" />
          </div>

          <div className="skeleton-post-actions">
            <div className="skeleton skeleton-action" />
            <div className="skeleton skeleton-action" />
            <div className="skeleton skeleton-action" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function DestinationSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-destination-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article
          className="skeleton-destination-card"
          key={`destination-skeleton-${index}`}
        >
          <div className="skeleton skeleton-destination-image" />

          <div className="skeleton-destination-content">
            <div className="skeleton skeleton-line skeleton-line-title" />
            <div className="skeleton skeleton-line skeleton-line-medium" />

            <div className="skeleton-destination-stats">
              <div className="skeleton skeleton-stat-box" />
              <div className="skeleton skeleton-stat-box" />
            </div>

            <div className="skeleton skeleton-button" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function CategorySkeleton({ count = 6 }) {
  return (
    <div className="skeleton-category-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article
          className="skeleton-category-card"
          key={`category-skeleton-${index}`}
        >
          <div className="skeleton skeleton-category-image" />

          <div className="skeleton-category-content">
            <div className="skeleton skeleton-line skeleton-line-title" />
            <div className="skeleton skeleton-line skeleton-line-full" />
            <div className="skeleton skeleton-line skeleton-line-medium" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile" aria-hidden="true">
      <div className="skeleton skeleton-profile-cover" />

      <div className="skeleton-profile-main">
        <div className="skeleton skeleton-profile-avatar" />

        <div className="skeleton-profile-info">
          <div className="skeleton skeleton-line skeleton-profile-name" />
          <div className="skeleton skeleton-line skeleton-line-medium" />
          <div className="skeleton skeleton-line skeleton-line-full" />
        </div>
      </div>

      <div className="skeleton-profile-stats">
        <div className="skeleton skeleton-stat-box" />
        <div className="skeleton skeleton-stat-box" />
        <div className="skeleton skeleton-stat-box" />
        <div className="skeleton skeleton-stat-box" />
      </div>
    </div>
  );
}