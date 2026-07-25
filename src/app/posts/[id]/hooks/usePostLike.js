"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export default function usePostLike({
  postId,
  currentUser,
  initialLikesCount = 0,
}) {
  const [isLiked, setIsLiked] =
    useState(false);

  const [likesCount, setLikesCount] =
    useState(
      Number.isFinite(
        Number(initialLikesCount)
      )
        ? Number(initialLikesCount)
        : 0
    );

  const [
    isLikeLoading,
    setIsLikeLoading,
  ] = useState(false);

  const [likeError, setLikeError] =
    useState("");

  const loadLikeState =
    useCallback(async () => {
      if (!postId) {
        return;
      }

      try {
        setLikeError("");

        const response = await fetch(
          `/api/posts/${postId}/like`,
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
              "Aprecierea nu a putut fi încărcată."
          );
        }

        setIsLiked(
          Boolean(data?.liked)
        );

        setLikesCount(
          Number.isFinite(
            Number(data?.likesCount)
          )
            ? Number(data.likesCount)
            : 0
        );
      } catch (loadError) {
        console.error(
          "Eroare la încărcarea aprecierii:",
          loadError
        );

        setLikeError(
          loadError?.message ||
            "Aprecierea nu a putut fi încărcată."
        );
      }
    }, [postId]);

  const toggleLike =
    useCallback(async () => {
      if (
        !postId ||
        isLikeLoading
      ) {
        return;
      }

      if (!currentUser) {
        setLikeError(
          "Trebuie să fii autentificat pentru a aprecia postarea."
        );

        return;
      }

      try {
        setIsLikeLoading(true);
        setLikeError("");

        const response = await fetch(
          `/api/posts/${postId}/like`,
          {
            method: isLiked
              ? "DELETE"
              : "POST",
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
              "Aprecierea nu a putut fi actualizată."
          );
        }

        setIsLiked(
          Boolean(data?.liked)
        );

        setLikesCount(
          Number.isFinite(
            Number(data?.likesCount)
          )
            ? Number(data.likesCount)
            : 0
        );
      } catch (toggleError) {
        console.error(
          "Eroare la actualizarea aprecierii:",
          toggleError
        );

        setLikeError(
          toggleError?.message ||
            "Aprecierea nu a putut fi actualizată."
        );
      } finally {
        setIsLikeLoading(false);
      }
    }, [
      currentUser,
      isLiked,
      isLikeLoading,
      postId,
    ]);

  useEffect(() => {
    setLikesCount(
      Number.isFinite(
        Number(initialLikesCount)
      )
        ? Number(initialLikesCount)
        : 0
    );
  }, [initialLikesCount]);

  useEffect(() => {
    loadLikeState();
  }, [loadLikeState]);

  return {
    isLiked,
    likesCount,
    isLikeLoading,
    likeError,

    setLikeError,

    toggleLike,
    refetchLike: loadLikeState,
  };
}