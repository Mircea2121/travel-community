import CommentForm from "./commentForm";
import CommentItem from "./commentItem";

export default function CommentsSection({
  comments = [],
  commentsCount = 0,
  commentsLoading = false,
  commentsError = "",

  currentUser = null,

  commentContent = "",
  commentError = "",
  isCommentSubmitting = false,

  activeReplyCommentId = "",
  replyContent = "",
  replyError = "",
  isReplySubmitting = false,

  repliesByComment = {},
  repliesLoadingByComment = {},
  repliesCountByComment = {},
  expandedRepliesByComment = {},

  onCommentContentChange,
  onCommentSubmit,

  onOpenReplyForm,
  onCloseReplyForm,
  onReplyContentChange,
  onReplySubmit,
  onToggleReplies,
  onOpenCommentMenu,
}) {
  const isAuthenticated = Boolean(
    currentUser
  );

  return (
    <div className="comments-box">
      <div className="comments-section-header">
        <div>
          <span className="comments-section-label">
            Discuție
          </span>

          <h2>
            Comentarii și întrebări
          </h2>
        </div>

        <span className="comments-section-count">
          {commentsCount}
        </span>
      </div>

      <CommentForm
        value={commentContent}
        error={commentError}
        isSubmitting={
          isCommentSubmitting
        }
        isAuthenticated={
          isAuthenticated
        }
        onChange={
          onCommentContentChange
        }
        onSubmit={
          onCommentSubmit
        }
      />

      {commentsError && (
        <div
          className="comment-error"
          role="alert"
        >
          {commentsError}
        </div>
      )}

      {commentsLoading ? (
        <p className="no-comments">
          Se încarcă comentariile...
        </p>
      ) : comments.length === 0 ? (
        <p className="no-comments">
          Nu există comentarii încă.
          Fii primul care răspunde.
        </p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const commentId =
              String(
                comment?._id ||
                  comment?.id ||
                  ""
              );

            const replies =
              repliesByComment[
                commentId
              ] || [];

            const isRepliesLoading =
              Boolean(
                repliesLoadingByComment[
                  commentId
                ]
              );

            const repliesCountValue =
              Number(
                repliesCountByComment[
                  commentId
                ]
              );

            const repliesCount =
              Number.isFinite(
                repliesCountValue
              )
                ? repliesCountValue
                : replies.length;

            const isRepliesExpanded =
              Boolean(
                expandedRepliesByComment[
                  commentId
                ]
              );

            const isReplyFormOpen =
              activeReplyCommentId ===
              commentId;

            return (
              <CommentItem
                key={commentId}
                comment={comment}
                replies={replies}
                repliesCount={
                  repliesCount
                }
                isRepliesLoading={
                  isRepliesLoading
                }
                isRepliesExpanded={
                  isRepliesExpanded
                }
                isReplyFormOpen={
                  isReplyFormOpen
                }
                replyValue={
                  replyContent
                }
                replyError={
                  replyError
                }
                isReplySubmitting={
                  isReplySubmitting
                }
                isAuthenticated={
                  isAuthenticated
                }
                onOpenReplyForm={
                  onOpenReplyForm
                }
                onCloseReplyForm={
                  onCloseReplyForm
                }
                onReplyChange={
                  onReplyContentChange
                }
                onReplySubmit={
                  onReplySubmit
                }
                onToggleReplies={
                  onToggleReplies
                }
                onOpenMenu={
                  onOpenCommentMenu
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}