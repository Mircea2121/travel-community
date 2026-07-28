"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export default function useComments({
  postId,
  currentUser,
  initialCommentsCount = 0,
}) {
  const [comments, setComments] =
    useState([]);

  const [
    commentsCount,
    setCommentsCount,
  ] = useState(
    Number.isFinite(
      Number(initialCommentsCount)
    )
      ? Number(initialCommentsCount)
      : 0
  );

  const [
    commentsLoading,
    setCommentsLoading,
  ] = useState(true);

  const [
    commentsError,
    setCommentsError,
  ] = useState("");

  const [
    commentContent,
    setCommentContent,
  ] = useState("");

  const [
    isCommentSubmitting,
    setIsCommentSubmitting,
  ] = useState(false);

  const [
    commentError,
    setCommentError,
  ] = useState("");

  const [
    activeReplyCommentId,
    setActiveReplyCommentId,
  ] = useState("");

  const [
    replyToUser,
    setReplyToUser,
  ] = useState(null);

  const [
    replyContent,
    setReplyContent,
  ] = useState("");

  const [
    replyError,
    setReplyError,
  ] = useState("");

  const [
    isReplySubmitting,
    setIsReplySubmitting,
  ] = useState(false);

  const [
    repliesByComment,
    setRepliesByComment,
  ] = useState({});

  const [
    repliesLoadingByComment,
    setRepliesLoadingByComment,
  ] = useState({});

  const [
    expandedRepliesByComment,
    setExpandedRepliesByComment,
  ] = useState({});

  const [
    repliesCountByComment,
    setRepliesCountByComment,
  ] = useState({});

  const getCommentId = useCallback(
    (comment) =>
      String(
        comment?._id ||
          comment?.id ||
          ""
      ),
    []
  );

  const getReplyAuthorName =
    useCallback((reply) => {
      const possibleNames = [
        reply?.name,
        reply?.authorName,
        reply?.author?.name,
        reply?.user?.name,
        reply?.username,
      ];

      const validName =
        possibleNames.find(
          (value) =>
            typeof value === "string" &&
            value.trim()
        );

      return validName
        ? validName.trim()
        : "utilizator";
    }, []);

  const loadComments =
    useCallback(async () => {
      if (!postId) {
        return;
      }

      try {
        setCommentsLoading(true);
        setCommentsError("");

        const response = await fetch(
          `/api/posts/${postId}/comments`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
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
              "Comentariile nu au putut fi încărcate."
          );
        }

        const receivedComments =
          Array.isArray(data?.comments)
            ? data.comments
            : [];

        const initialRepliesCounts = {};

        receivedComments.forEach(
          (comment) => {
            const commentId =
              getCommentId(comment);

            if (!commentId) {
              return;
            }

            const repliesCount =
              Number(
                comment?.repliesCount
              );

            initialRepliesCounts[
              commentId
            ] = Number.isFinite(
              repliesCount
            )
              ? repliesCount
              : 0;
          }
        );

        setComments(receivedComments);

        setRepliesCountByComment(
          initialRepliesCounts
        );

        setCommentsCount(
          Number.isFinite(
            Number(data?.commentsCount)
          )
            ? Number(data.commentsCount)
            : receivedComments.length
        );
      } catch (loadError) {
        console.error(
          "Eroare la încărcarea comentariilor:",
          loadError
        );

        setComments([]);

        setCommentsError(
          loadError?.message ||
            "Comentariile nu au putut fi încărcate."
        );
      } finally {
        setCommentsLoading(false);
      }
    }, [getCommentId, postId]);

  const submitComment =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (
          !postId ||
          isCommentSubmitting
        ) {
          return;
        }

        if (!currentUser) {
          setCommentError(
            "Trebuie să fii autentificat pentru a comenta."
          );

          return;
        }

        const trimmedContent =
          commentContent.trim();

        if (!trimmedContent) {
          setCommentError(
            "Comentariul nu poate fi gol."
          );

          return;
        }

        try {
          setIsCommentSubmitting(true);
          setCommentError("");

          const response = await fetch(
            `/api/posts/${postId}/comments`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                content:
                  trimmedContent,
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
                "Comentariul nu a putut fi publicat."
            );
          }

          if (data?.comment) {
            const newCommentId =
              getCommentId(
                data.comment
              );

            setComments(
              (currentComments) => [
                ...currentComments,
                data.comment,
              ]
            );

            if (newCommentId) {
              setRepliesCountByComment(
                (currentState) => ({
                  ...currentState,
                  [newCommentId]: 0,
                })
              );
            }
          }

          setCommentsCount(
            Number.isFinite(
              Number(data?.commentsCount)
            )
              ? Number(
                  data.commentsCount
                )
              : (currentCount) =>
                  currentCount + 1
          );

          setCommentContent("");
        } catch (submitError) {
          console.error(
            "Eroare la publicarea comentariului:",
            submitError
          );

          setCommentError(
            submitError?.message ||
              "Comentariul nu a putut fi publicat."
          );
        } finally {
          setIsCommentSubmitting(false);
        }
      },
      [
        commentContent,
        currentUser,
        getCommentId,
        isCommentSubmitting,
        postId,
      ]
    );

  const loadReplies =
    useCallback(
      async (commentId) => {
        if (!postId || !commentId) {
          return [];
        }

        try {
          setRepliesLoadingByComment(
            (currentState) => ({
              ...currentState,
              [commentId]: true,
            })
          );

          setReplyError("");

          const response = await fetch(
            `/api/posts/${postId}/comments/${commentId}/replies`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
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
                "Răspunsurile nu au putut fi încărcate."
            );
          }

          const receivedReplies =
            Array.isArray(data?.replies)
              ? data.replies
              : [];

          const receivedRepliesCount =
            Number.isFinite(
              Number(data?.repliesCount)
            )
              ? Number(
                  data.repliesCount
                )
              : receivedReplies.length;

          setRepliesByComment(
            (currentState) => ({
              ...currentState,
              [commentId]:
                receivedReplies,
            })
          );

          setRepliesCountByComment(
            (currentState) => ({
              ...currentState,
              [commentId]:
                receivedRepliesCount,
            })
          );

          return receivedReplies;
        } catch (loadError) {
          console.error(
            "Eroare la încărcarea răspunsurilor:",
            loadError
          );

          setReplyError(
            loadError?.message ||
              "Răspunsurile nu au putut fi încărcate."
          );

          return [];
        } finally {
          setRepliesLoadingByComment(
            (currentState) => ({
              ...currentState,
              [commentId]: false,
            })
          );
        }
      },
      [postId]
    );

  const toggleReplies =
    useCallback(
      async (comment) => {
        const commentId =
          getCommentId(comment);

        if (!commentId) {
          return;
        }

        const isCurrentlyExpanded =
          Boolean(
            expandedRepliesByComment[
              commentId
            ]
          );

        if (isCurrentlyExpanded) {
          setExpandedRepliesByComment(
            (currentState) => ({
              ...currentState,
              [commentId]: false,
            })
          );

          return;
        }

        setExpandedRepliesByComment(
          (currentState) => ({
            ...currentState,
            [commentId]: true,
          })
        );

        if (
          !Object.prototype.hasOwnProperty.call(
            repliesByComment,
            commentId
          )
        ) {
          await loadReplies(commentId);
        }
      },
      [
        expandedRepliesByComment,
        getCommentId,
        loadReplies,
        repliesByComment,
      ]
    );

  const openReplyForm =
    useCallback(
      (comment) => {
        const commentId =
          getCommentId(comment);

        if (!commentId) {
          return;
        }

        setActiveReplyCommentId(
          commentId
        );

        setReplyToUser(null);
        setReplyContent("");
        setReplyError("");
      },
      [getCommentId]
    );

  const openReplyToReplyForm =
    useCallback(
      (comment, reply) => {
        const commentId =
          getCommentId(comment);

        if (!commentId || !reply) {
          return;
        }

        const replyAuthorId = String(
          reply?.authorId ||
            reply?.userId ||
            reply?.author?._id ||
            reply?.user?._id ||
            ""
        );

        const replyUsername =
          typeof reply?.username ===
          "string"
            ? reply.username.trim()
            : typeof reply?.author
                  ?.username === "string"
              ? reply.author.username.trim()
              : typeof reply?.user
                    ?.username === "string"
                ? reply.user.username.trim()
                : "";

        setActiveReplyCommentId(
          commentId
        );

        setReplyToUser({
          userId: replyAuthorId,
          username: replyUsername,
          name:
            getReplyAuthorName(reply),
        });

        setReplyContent("");
        setReplyError("");

        setExpandedRepliesByComment(
          (currentState) => ({
            ...currentState,
            [commentId]: true,
          })
        );
      },
      [
        getCommentId,
        getReplyAuthorName,
      ]
    );

  const closeReplyForm =
    useCallback(() => {
      setActiveReplyCommentId("");
      setReplyToUser(null);
      setReplyContent("");
      setReplyError("");
    }, []);

  const submitReply =
    useCallback(
      async (event, comment) => {
        event.preventDefault();

        if (
          !postId ||
          isReplySubmitting
        ) {
          return;
        }

        if (!currentUser) {
          setReplyError(
            "Trebuie să fii autentificat pentru a răspunde."
          );

          return;
        }

        const commentId =
          getCommentId(comment);

        const trimmedContent =
          replyContent.trim();

        if (!commentId) {
          setReplyError(
            "Comentariul nu a putut fi identificat."
          );

          return;
        }

        if (!trimmedContent) {
          setReplyError(
            "Răspunsul nu poate fi gol."
          );

          return;
        }

        try {
          setIsReplySubmitting(true);
          setReplyError("");

          const response = await fetch(
            `/api/posts/${postId}/comments/${commentId}/replies`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                content:
                  trimmedContent,

                replyToUserId:
                  replyToUser?.userId ||
                  null,

                replyToUsername:
                  replyToUser?.username ||
                  null,

                replyToName:
                  replyToUser?.name ||
                  null,
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
                "Răspunsul nu a putut fi publicat."
            );
          }

          if (data?.reply) {
            setRepliesByComment(
              (currentState) => ({
                ...currentState,
                [commentId]: [
                  ...(
                    currentState[
                      commentId
                    ] || []
                  ),
                  data.reply,
                ],
              })
            );

            setRepliesCountByComment(
              (currentState) => ({
                ...currentState,
                [commentId]:
                  Number.isFinite(
                    Number(
                      data?.repliesCount
                    )
                  )
                    ? Number(
                        data.repliesCount
                      )
                    : Number(
                        currentState[
                          commentId
                        ] || 0
                      ) + 1,
              })
            );

            setExpandedRepliesByComment(
              (currentState) => ({
                ...currentState,
                [commentId]: true,
              })
            );
          }

          setReplyContent("");
          setReplyToUser(null);
          setActiveReplyCommentId("");
        } catch (submitError) {
          console.error(
            "Eroare la publicarea răspunsului:",
            submitError
          );

          setReplyError(
            submitError?.message ||
              "Răspunsul nu a putut fi publicat."
          );
        } finally {
          setIsReplySubmitting(false);
        }
      },
      [
        currentUser,
        getCommentId,
        isReplySubmitting,
        postId,
        replyContent,
        replyToUser,
      ]
    );

  const removeCommentFromState =
    useCallback(
      ({
        commentId,
        commentsCount:
          nextCommentsCount,
      }) => {
        const normalizedCommentId =
          String(commentId || "");

        if (!normalizedCommentId) {
          return;
        }

        setComments(
          (currentComments) =>
            currentComments.filter(
              (comment) =>
                getCommentId(
                  comment
                ) !==
                normalizedCommentId
            )
        );

        setRepliesByComment(
          (currentState) => {
            const nextState = {
              ...currentState,
            };

            delete nextState[
              normalizedCommentId
            ];

            return nextState;
          }
        );

        setRepliesCountByComment(
          (currentState) => {
            const nextState = {
              ...currentState,
            };

            delete nextState[
              normalizedCommentId
            ];

            return nextState;
          }
        );

        setExpandedRepliesByComment(
          (currentState) => {
            const nextState = {
              ...currentState,
            };

            delete nextState[
              normalizedCommentId
            ];

            return nextState;
          }
        );

        if (
          activeReplyCommentId ===
          normalizedCommentId
        ) {
          closeReplyForm();
        }

        setCommentsCount(
          Number.isFinite(
            Number(nextCommentsCount)
          )
            ? Number(
                nextCommentsCount
              )
            : (currentCount) =>
                Math.max(
                  0,
                  currentCount - 1
                )
        );
      },
      [
        activeReplyCommentId,
        closeReplyForm,
        getCommentId,
      ]
    );

  useEffect(() => {
    setCommentsCount(
      Number.isFinite(
        Number(initialCommentsCount)
      )
        ? Number(initialCommentsCount)
        : 0
    );
  }, [initialCommentsCount]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
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
    setCommentError,
    setReplyContent,
    setReplyError,

    submitComment,

    openReplyForm,
    openReplyToReplyForm,
    closeReplyForm,
    submitReply,

    toggleReplies,
    loadReplies,

    removeCommentFromState,

    refetchComments:
      loadComments,
  };
}