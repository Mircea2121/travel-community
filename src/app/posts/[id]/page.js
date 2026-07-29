"use client";

import {
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import PostHeader from "./components/postHeader";
import PostGallery from "./components/postGallery";
import PostContent from "./components/postContent";
import PostActions from "./components/postActions";
import CommentsSection from "./components/commentsSection";
import ReportModal from "./components/reportModal";
import { useToast } from "../../components/toast/toastProvider";
import usePostDetails from "./hooks/usePostDetails";
import usePostLike from "./hooks/usePostLike";
import useComments from "./hooks/useComments";

import {
  getPostImages,
  getUserId,
} from "./utils/postDetailsHelpers";

import "./postDetails.css";

function getContentId(content) {
  return String(
    content?._id ||
      content?.id ||
      ""
  );
}

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const postId = params?.id;

  const [
    reportTarget,
    setReportTarget,
  ] = useState(null);

  const [
    reportReason,
    setReportReason,
  ] = useState("");

  const [
    reportDetails,
    setReportDetails,
  ] = useState("");

  const [
    reportError,
    setReportError,
  ] = useState("");

  const [
    reportSuccess,
    setReportSuccess,
  ] = useState("");

  const [
    isReportSubmitting,
    setIsReportSubmitting,
  ] = useState(false);

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

    deletingCommentId,
    deletingReplyId,
    deleteCommentError,

    setCommentContent,
    setReplyContent,
    setDeleteCommentError,

    submitComment,
    openReplyForm,
    openReplyToReplyForm,
    closeReplyForm,
    submitReply,

    toggleReplies,
    deleteComment,
    deleteReply,
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

  async function handleDeleteComment(
    comment
  ) {
    if (
      !comment ||
      deletingCommentId
    ) {
      return;
    }

    setDeleteCommentError("");

    const confirmed =
      window.confirm(
        "Sigur vrei să ștergi acest comentariu? Dacă are răspunsuri, vor fi șterse și ele."
      );

    if (!confirmed) {
      return;
    }

    await deleteComment(comment);
  }

  async function handleDeleteReply(
    comment,
    reply
  ) {
    if (
      !comment ||
      !reply ||
      deletingReplyId
    ) {
      return;
    }

    setDeleteCommentError("");

    const confirmed =
      window.confirm(
        "Sigur vrei să ștergi acest răspuns?"
      );

    if (!confirmed) {
      return;
    }

    await deleteReply(
      comment,
      reply
    );
  }

  function resetReportForm() {
    setReportReason("");
    setReportDetails("");
    setReportError("");
    setReportSuccess("");
  }

  function handleCloseReportModal() {
    if (isReportSubmitting) {
      return;
    }

    setReportTarget(null);
    resetReportForm();
  }

  function handleReportComment(
    comment
  ) {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const targetId =
      getContentId(comment);

    if (!targetId) {
      return;
    }

    resetReportForm();

    setReportTarget({
      targetId,
      targetType: "comment",
      targetLabel: "comentariul",
    });
  }

  function handleReportReply(
    comment,
    reply
  ) {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const targetId =
      getContentId(reply);

    if (!targetId) {
      return;
    }

    resetReportForm();

    setReportTarget({
      targetId,
      targetType: "comment",
      targetLabel: "răspunsul",
      parentCommentId:
        getContentId(comment),
    });
  }

  async function handleSubmitReport(
    event
  ) {
    event.preventDefault();

    if (
      !reportTarget ||
      isReportSubmitting
    ) {
      return;
    }

    setReportError("");
    setReportSuccess("");

    if (!reportReason) {
      setReportError(
        "Selectează motivul raportării."
      );

      return;
    }

    if (
      reportReason === "other" &&
      !reportDetails.trim()
    ) {
      setReportError(
        "Descrie motivul raportării."
      );

      return;
    }

    try {
      setIsReportSubmitting(true);

      const response = await fetch(
        "/api/reports",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            targetType:
              reportTarget.targetType,

            targetId:
              reportTarget.targetId,

            reason:
              reportReason,

            details:
              reportDetails.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Raportul nu a putut fi trimis."
        );
      }

      toast.success(
        data?.message ||
          "Raportul a fost trimis cu succes.",
        "Raport trimis"
      );

      setReportTarget(null);
      resetReportForm();
    } catch (submitError) {
      console.error(
        "Eroare la trimiterea raportului:",
        submitError
      );

      const errorMessage =
        submitError?.message ||
        "Raportul nu a putut fi trimis.";

      setReportError(errorMessage);

      toast.error(
        errorMessage,
        "Raportul nu a fost trimis"
      );
    } finally {
      setIsReportSubmitting(false);
    }
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

  const currentUserId =
    getUserId(currentUser);

  const postAuthorId =
    String(
      post.authorId ||
        post.userId ||
        ""
    );

  const isOwner =
    Boolean(currentUserId) &&
    currentUserId ===
      postAuthorId;

  const displayedActionError =
    actionError ||
    likeError ||
    deleteCommentError;

  return (
    <>
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
              postAuthorId={
                postAuthorId
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
              deletingCommentId={
                deletingCommentId
              }
              deletingReplyId={
                deletingReplyId
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
              onDeleteComment={
                handleDeleteComment
              }
              onDeleteReply={
                handleDeleteReply
              }
              onReportComment={
                handleReportComment
              }
              onReportReply={
                handleReportReply
              }
            />
          </article>
        </div>
      </section>

      <ReportModal
        isOpen={Boolean(reportTarget)}
        targetLabel={
          reportTarget?.targetLabel ||
          "conținutul"
        }
        selectedReason={
          reportReason
        }
        details={reportDetails}
        error={reportError}
        successMessage={
          reportSuccess
        }
        isSubmitting={
          isReportSubmitting
        }
        onReasonChange={(
          nextReason
        ) => {
          setReportReason(
            nextReason
          );

          setReportError("");
          setReportSuccess("");
        }}
        onDetailsChange={(
          nextDetails
        ) => {
          setReportDetails(
            nextDetails
          );

          setReportError("");
          setReportSuccess("");
        }}
        onSubmit={
          handleSubmitReport
        }
        onClose={
          handleCloseReportModal
        }
      />
    </>
  );
}