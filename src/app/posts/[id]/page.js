"use client";

import {
  useParams,
  useRouter,
} from "next/navigation";

import PostHeader from "./components/postHeader";
import PostGallery from "./components/postGallery";
import PostContent from "./components/postContent";
import PostActions from "./components/postActions";
import CommentsSection from "./components/commentsSection";

import usePostDetails from "./hooks/usePostDetails";
import usePostLike from "./hooks/usePostLike";
import useComments from "./hooks/useComments";

import {
  getPostImages,
  getUserId,
} from "./utils/postDetailsHelpers";

import "./postDetails.css";

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const postId = params?.id;

  const {
    post,
    currentUser,
    loading,
    error,
    actionError,
    isDeleting,
    setActionError,
    deletePost,
  } = usePostDetails(postId);

  const {
    isLiked,
    likesCount,
    isLikeLoading,
    likeError,
    setLikeError,
    toggleLike,
  } = usePostLike({
    postId,
    currentUser,
    initialLikesCount:
      post?.likesCount || 0,
  });

  const {
    comments,
    commentsCount,
    commentsLoading,
    commentsError,

    commentContent,
    commentError,
    isCommentSubmitting,

    activeReplyCommentId,
    replyToUser,
    replyContent,
    replyError,
    isReplySubmitting,

    repliesByComment,
    repliesLoadingByComment,
    repliesCountByComment,
    expandedRepliesByComment,

    setCommentContent,
    setReplyContent,

    submitComment,
    openReplyForm,
    openReplyToReplyForm,
    closeReplyForm,
    submitReply,

    toggleReplies,
  } = useComments({
    postId,
    currentUser,
    initialCommentsCount:
      post?.commentsCount || 0,
  });

  function handleBack() {
    router.back();
  }

  function handleEditPost() {
    if (!postId) {
      return;
    }

    router.push(
      `/posts/${postId}/edit`
    );
  }

  async function handleDeletePost() {
    if (!postId || isDeleting) {
      return;
    }

    const confirmed =
      window.confirm(
        "Sigur vrei să ștergi această postare? Imaginile vor fi șterse și din Cloudinary."
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deletePost();

    if (!result?.success) {
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  async function handleLike() {
    setActionError("");
    setLikeError("");

    await toggleLike();
  }

  function handleOpenCommentMenu(
    comment
  ) {
    console.log(
      "Meniu comentariu:",
      comment
    );
  }

  if (loading) {
    return (
      <section className="post-details-page">
        <div className="post-details-container">
          <p>
            Se încarcă postarea...
          </p>
        </div>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="post-details-page">
        <div className="post-details-container">
          <button
            type="button"
            className="back-button"
            onClick={handleBack}
          >
            Înapoi
          </button>

          <h1>
            {error ||
              "Postarea nu a fost găsită."}
          </h1>
        </div>
      </section>
    );
  }

  const images =
    getPostImages(post);

  const isOwner =
    Boolean(currentUser) &&
    getUserId(currentUser) ===
      String(post.authorId || "");

  const displayedActionError =
    actionError || likeError;

  return (
    <section className="post-details-page">
      <div className="post-details-container">
        <PostHeader
          post={post}
          isOwner={isOwner}
          isDeleting={isDeleting}
          onBack={handleBack}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
        />

        {displayedActionError && (
          <div
            className="post-action-error"
            role="alert"
          >
            {displayedActionError}
          </div>
        )}

        <article className="post-details-card">
          <PostGallery
            images={images}
            title={
              post.title || "Postare"
            }
          />

          <PostContent post={post} />

          <PostActions
            isLiked={isLiked}
            likesCount={likesCount}
            commentsCount={
              commentsCount
            }
            isLikeLoading={
              isLikeLoading
            }
            onLike={handleLike}
          />

          <CommentsSection
            comments={comments}
            commentsCount={
              commentsCount
            }
            commentsLoading={
              commentsLoading
            }
            commentsError={
              commentsError
            }
            currentUser={
              currentUser
            }
            commentContent={
              commentContent
            }
            commentError={
              commentError
            }
            isCommentSubmitting={
              isCommentSubmitting
            }
            activeReplyCommentId={
              activeReplyCommentId
            }
            replyToUser={
              replyToUser
            }
            replyContent={
              replyContent
            }
            replyError={
              replyError
            }
            isReplySubmitting={
              isReplySubmitting
            }
            repliesByComment={
              repliesByComment
            }
            repliesLoadingByComment={
              repliesLoadingByComment
            }
            repliesCountByComment={
              repliesCountByComment
            }
            expandedRepliesByComment={
              expandedRepliesByComment
            }
            onCommentContentChange={
              setCommentContent
            }
            onCommentSubmit={
              submitComment
            }
            onOpenReplyForm={
              openReplyForm
            }
            onReplyToReply={
              openReplyToReplyForm
            }
            onCloseReplyForm={
              closeReplyForm
            }
            onReplyContentChange={
              setReplyContent
            }
            onReplySubmit={
              submitReply
            }
            onToggleReplies={
              toggleReplies
            }
            onOpenCommentMenu={
              handleOpenCommentMenu
            }
          />
        </article>
      </div>
    </section>
  );
}