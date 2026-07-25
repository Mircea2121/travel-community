import {
  getAvatarUrl,
  getUserDisplayName,
  getUserInitial,
  formatCommentDate,
} from "../utils/postDetailsHelpers";

export default function RepliesList({
  replies = [],
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <p className="replies-loading">
        Se încarcă răspunsurile...
      </p>
    );
  }

  if (!Array.isArray(replies) || replies.length === 0) {
    return null;
  }

  return (
    <div className="replies-list">
      {replies.map((reply) => {
        const replyId =
          reply?._id ||
          reply?.id;

        const authorName =
          getUserDisplayName(reply);

        const avatarUrl =
          getAvatarUrl(reply?.avatar);

        return (
          <article
            key={replyId}
            className="reply-card"
          >
            <div className="reply-avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={authorName}
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";

                    const fallback =
                      event.currentTarget
                        .nextElementSibling;

                    if (fallback) {
                      fallback.style.display =
                        "flex";
                    }
                  }}
                />
              ) : null}

              <span
                className="reply-avatar-fallback"
                style={{
                  display: avatarUrl
                    ? "none"
                    : "flex",
                }}
              >
                {getUserInitial(reply)}
              </span>
            </div>

            <div className="reply-content">
              <div className="reply-header">
                <div>
                  <strong>
                    {authorName}
                  </strong>

                  {reply?.username && (
                    <span>
                      @{reply.username}
                    </span>
                  )}
                </div>

                <time>
                  {formatCommentDate(
                    reply?.createdAt
                  )}
                </time>
              </div>

              <p>{reply?.content}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}