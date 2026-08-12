"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

const COMMENTS_PAGE_SIZE = 15;

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
    isLoadingMoreComments,
    setIsLoadingMoreComments,
  ] = useState(false);

  const [
    hasMoreComments,
    setHasMoreComments,
  ] = useState(false);

  const [
    nextCommentsSkip,
    setNextCommentsSkip,
  ] = useState(0);

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

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState("");

  const [
    deletingReplyId,
    setDeletingReplyId,
  ] = useState("");

  const [
    deleteCommentError,
    setDeleteCommentError,
  ] = useState("");

  const getCommentId = useCallback(
    (comment) =>
      String(
        comment?._id ||
          comment?.id ||
          ""
      ),
    []
  );

  const getReplyId = useCallback(
    (reply) =>
      String(
        reply?._id ||
          reply?.id ||
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
        setComments([]);
        setHasMoreComments(false);
        setNextCommentsSkip(0);
        setCommentsLoading(false);

        return;
      }

      try {
        setCommentsLoading(true);
        setCommentsError("");
        setHasMoreComments(false);
        setNextCommentsSkip(0);

        const response = await fetch(
          `/api/posts/${postId}/comments?skip=0&limit=${COMMENTS_PAGE_SIZE}`,
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

        setComments(
          receivedComments
        );

        setRepliesCountByComment(
          initialRepliesCounts
        );

        setCommentsCount(
          Number.isFinite(
            Number(data?.commentsCount)
          )
            ? Number(
                data.commentsCount
              )
            : receivedComments.length
        );

        setHasMoreComments(
          Boolean(data?.hasMore)
        );

        setNextCommentsSkip(
          Number.isFinite(
            Number(data?.nextSkip)
          )
            ? Number(data.nextSkip)
            : receivedComments.length
        );
      } catch (loadError) {
        console.error(
          "Eroare la încărcarea comentariilor:",
          loadError
        );

        setComments([]);
        setRepliesCountByComment({});
        setHasMoreComments(false);
        setNextCommentsSkip(0);

        setCommentsError(
          loadError?.message ||
            "Comentariile nu au putut fi încărcate."
        );
      } finally {
        setCommentsLoading(false);
      }
    }, [getCommentId, postId]);
  
  const loadMoreComments =
  useCallback(async () => {
    if (
      !postId ||
      !hasMoreComments ||
      isLoadingMoreComments
    ) {
      return;
    }

    try {
      setIsLoadingMoreComments(true);
      setCommentsError("");

      const response = await fetch(
        `/api/posts/${postId}/comments?skip=${nextCommentsSkip}&limit=${COMMENTS_PAGE_SIZE}`,
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
            "Următoarele comentarii nu au putut fi încărcate."
        );
      }

      const receivedComments =
        Array.isArray(data?.comments)
          ? data.comments
          : [];

      setComments(
        (currentComments) => {
          const existingCommentIds =
            new Set(
              currentComments
                .map(getCommentId)
                .filter(Boolean)
            );

          const newComments =
            receivedComments.filter(
              (comment) => {
                const commentId =
                  getCommentId(
                    comment
                  );

                return (
                  commentId &&
                  !existingCommentIds.has(
                    commentId
                  )
                );
              }
            );

          return [
            ...currentComments,
            ...newComments,
          ];
        }
      );

      setRepliesCountByComment(
        (currentState) => {
          const nextState = {
            ...currentState,
          };

          receivedComments.forEach(
            (comment) => {
              const commentId =
                getCommentId(
                  comment
                );

              if (!commentId) {
                return;
              }

              const repliesCount =
                Number(
                  comment?.repliesCount
                );

              nextState[commentId] =
                Number.isFinite(
                  repliesCount
                )
                  ? repliesCount
                  : 0;
            }
          );

          return nextState;
        }
      );

      setCommentsCount(
        Number.isFinite(
          Number(data?.commentsCount)
        )
          ? Number(
              data.commentsCount
            )
          : (currentCount) =>
              currentCount
      );

      setHasMoreComments(
        Boolean(data?.hasMore)
      );

      setNextCommentsSkip(
        Number.isFinite(
          Number(data?.nextSkip)
        )
          ? Number(data.nextSkip)
          : nextCommentsSkip +
              receivedComments.length
      );
    } catch (loadError) {
      console.error(
        "Eroare la încărcarea următoarelor comentarii:",
        loadError
      );

      setCommentsError(
        loadError?.message ||
          "Următoarele comentarii nu au putut fi încărcate."
      );
    } finally {
      setIsLoadingMoreComments(false);
    }
  }, [
    getCommentId,
    hasMoreComments,
    isLoadingMoreComments,
    nextCommentsSkip,
    postId,
  ]);

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
            await loadComments();
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
        isCommentSubmitting,
        loadComments,
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
          replyId:
            getReplyId(reply),
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
        getReplyId,
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

                parentReplyId:
                  replyToUser?.replyId ||
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

  const removeReplyFromState =
    useCallback(
      ({
        commentId,
        replyId,
        repliesCount:
          nextRepliesCount,
        commentsCount:
          nextCommentsCount,
      }) => {
        const normalizedCommentId =
          String(commentId || "");

        const normalizedReplyId =
          String(replyId || "");

        if (
          !normalizedCommentId ||
          !normalizedReplyId
        ) {
          return;
        }

        setRepliesByComment(
          (currentState) => ({
            ...currentState,
            [normalizedCommentId]: (
              currentState[
                normalizedCommentId
              ] || []
            ).filter(
              (reply) =>
                getReplyId(reply) !==
                normalizedReplyId
            ),
          })
        );

        setRepliesCountByComment(
          (currentState) => ({
            ...currentState,
            [normalizedCommentId]:
              Number.isFinite(
                Number(
                  nextRepliesCount
                )
              )
                ? Number(
                    nextRepliesCount
                  )
                : Math.max(
                    0,
                    Number(
                      currentState[
                        normalizedCommentId
                      ] || 0
                    ) - 1
                  ),
          })
        );

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
      [getReplyId]
    );

  const deleteComment =
    useCallback(
      async (comment) => {
        const commentId =
          getCommentId(comment);

        if (
          !postId ||
          !commentId ||
          deletingCommentId
        ) {
          return {
            success: false,
          };
        }

        if (!currentUser) {
          setDeleteCommentError(
            "Trebuie să fii autentificat pentru a șterge un comentariu."
          );

          return {
            success: false,
          };
        }

        try {
          setDeletingCommentId(
            commentId
          );

          setDeleteCommentError("");

          const response = await fetch(
            `/api/posts/${postId}/comments/${commentId}`,
            {
              method: "DELETE",
              credentials: "include",
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
                "Comentariul nu a putut fi șters."
            );
          }

          removeCommentFromState({
            commentId:
              data?.deletedCommentId ||
              commentId,

            commentsCount:
              data?.commentsCount,
          });

          return {
            success: true,
            data,
          };
        } catch (deleteError) {
          console.error(
            "Eroare la ștergerea comentariului:",
            deleteError
          );

          setDeleteCommentError(
            deleteError?.message ||
              "Comentariul nu a putut fi șters."
          );

          return {
            success: false,
            error:
              deleteError?.message ||
              "Comentariul nu a putut fi șters.",
          };
        } finally {
          setDeletingCommentId("");
        }
      },
      [
        currentUser,
        deletingCommentId,
        getCommentId,
        postId,
        removeCommentFromState,
      ]
    );

  const deleteReply =
    useCallback(
      async (comment, reply) => {
        const commentId =
          getCommentId(comment);

        const replyId =
          getReplyId(reply);

        if (
          !postId ||
          !commentId ||
          !replyId ||
          deletingReplyId
        ) {
          return {
            success: false,
          };
        }

        if (!currentUser) {
          setDeleteCommentError(
            "Trebuie să fii autentificat pentru a șterge un răspuns."
          );

          return {
            success: false,
          };
        }

        try {
          setDeletingReplyId(replyId);
          setDeleteCommentError("");

          const response = await fetch(
            `/api/posts/${postId}/comments/${commentId}/replies/${replyId}`,
            {
              method: "DELETE",
              credentials: "include",
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
                "Răspunsul nu a putut fi șters."
            );
          }

          removeReplyFromState({
            commentId:
              data?.parentCommentId ||
              commentId,

            replyId:
              data?.deletedReplyId ||
              replyId,

            repliesCount:
              data?.repliesCount,

            commentsCount:
              data?.commentsCount,
          });

          return {
            success: true,
            data,
          };
        } catch (deleteError) {
          console.error(
            "Eroare la ștergerea răspunsului:",
            deleteError
          );

          setDeleteCommentError(
            deleteError?.message ||
              "Răspunsul nu a putut fi șters."
          );

          return {
            success: false,
            error:
              deleteError?.message ||
              "Răspunsul nu a putut fi șters.",
          };
        } finally {
          setDeletingReplyId("");
        }
      },
      [
        currentUser,
        deletingReplyId,
        getCommentId,
        getReplyId,
        postId,
        removeReplyFromState,
      ]
    );

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setCommentsCount(
        Number.isFinite(
          Number(initialCommentsCount)
        )
          ? Number(initialCommentsCount)
          : 0
      );
    }, 0);

    return () => {
      window.clearTimeout(syncTimer);
    };
  }, [initialCommentsCount]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadComments();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadComments]);

  return {
    comments,
    commentsCount,
    commentsLoading,
    commentsError,

    hasMoreComments,
    isLoadingMoreComments,

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
    setCommentError,
    setReplyContent,
    setReplyError,
    setDeleteCommentError,

    submitComment,

    openReplyForm,
    openReplyToReplyForm,
    closeReplyForm,
    submitReply,

    toggleReplies,
    loadReplies,

    deleteComment,
    deleteReply,

    removeCommentFromState,
    removeReplyFromState,
    
    loadMoreComments,

    refetchComments:
      loadComments,
  };
}
