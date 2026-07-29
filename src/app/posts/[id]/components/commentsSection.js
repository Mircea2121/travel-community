import CommentForm from "./commentForm";
import CommentItem from "./commentItem";

export default function CommentsSection({
  comments = [],
  commentsCount = 0,
  commentsLoading = false,
  commentsError = "",

  hasMoreComments = false,
  isLoadingMoreComments = false,

  currentUser = null,
  postAuthorId = "",

  commentContent = "",
  commentError = "",
  isCommentSubmitting = false,

  activeReplyCommentId = "",
  replyToUser = null,
  replyContent = "",
  replyError = "",
  isReplySubmitting = false,

  repliesByComment = {},
  repliesLoadingByComment = {},
  repliesCountByComment = {},
  expandedRepliesByComment = {},

  deletingCommentId = "",
  deletingReplyId = "",

  onCommentContentChange,
  onCommentSubmit,

  onOpenReplyForm,
  onReplyToReply,
  onCloseReplyForm,
  onReplyContentChange,
  onReplySubmit,
  onToggleReplies,

  onDeleteComment,
  onDeleteReply,
  onReportComment,
  onReportReply,

  onLoadMoreComments,
}) {
  const isAuthenticated =
    Boolean(currentUser);

  return (
    <div className="comments-box">
      <div className="comments-section-header">
        <div>
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
        <>
          <div className="comments-list">
            {comments.map(
              (comment) => {
                const commentId =
                  String(
                    comment?._id ||
                      comment?.id ||
                      ""
                  );

                if (!commentId) {
                  return null;
                }

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

                const isCommentDeleting =
                  deletingCommentId ===
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
                    replyToUser={
                      replyToUser
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
                    currentUser={
                      currentUser
                    }
                    postAuthorId={
                      postAuthorId
                    }
                    isCommentDeleting={
                      isCommentDeleting
                    }
                    deletingReplyId={
                      deletingReplyId
                    }
                    onOpenReplyForm={
                      onOpenReplyForm
                    }
                    onReplyToReply={
                      onReplyToReply
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
                    onDeleteComment={
                      onDeleteComment
                    }
                    onDeleteReply={
                      onDeleteReply
                    }
                    onReportComment={
                      onReportComment
                    }
                    onReportReply={
                      onReportReply
                    }
                  />
                );
              }
            )}
          </div>

          {hasMoreComments && (
            <div className="load-more-comments-wrapper">
              <button
                type="button"
                className="load-more-comments-button"
                disabled={
                  isLoadingMoreComments
                }
                onClick={
                  onLoadMoreComments
                }
              >
                {isLoadingMoreComments
                  ? "Se încarcă..."
                  : "Încarcă mai multe comentarii"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}