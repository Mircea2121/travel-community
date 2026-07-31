"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export default function usePostDetails(postId) {
  const [post, setPost] = useState(null);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [isSaved, setIsSaved] =
    useState(false);

  const [isSaveLoading, setIsSaveLoading] =
    useState(false);

  const loadPostDetails =
    useCallback(async () => {
      if (!postId) {
        return;
      }

      try {
        setLoading(true);
        setError("");
        setActionError("");

        const [
          postResponse,
          authResponse,
          savedResponse,
        ] = await Promise.all([
          fetch(`/api/posts/${postId}`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),

          fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),

          fetch(`/api/posts/${postId}/save`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const postData =
          await postResponse.json();

        if (
          !postResponse.ok ||
          !postData?.success
        ) {
          throw new Error(
            postData?.message ||
              "Postarea nu a putut fi încărcată."
          );
        }

        let authenticatedUser = null;

        if (authResponse.ok) {
          const authData =
            await authResponse.json();

          authenticatedUser =
            authData?.user ||
            authData?.data?.user ||
            null;
        }

        let savedState = false;

        if (savedResponse.ok) {
          const savedData =
            await savedResponse.json();

          savedState = Boolean(
            savedData?.isSaved
          );
        }

        setPost(postData.post);
        setCurrentUser(authenticatedUser);
        setIsSaved(savedState);
      } catch (loadError) {
        console.error(
          "Eroare la încărcarea postării:",
          loadError
        );

        setPost(null);
        setIsSaved(false);

        setError(
          loadError?.message ||
            "Postarea nu a putut fi încărcată."
        );
      } finally {
        setLoading(false);
      }
    }, [postId]);

  const deletePost =
    useCallback(async () => {
      if (!postId || isDeleting) {
        return {
          success: false,
        };
      }

      try {
        setIsDeleting(true);
        setActionError("");

        const response = await fetch(
          `/api/posts/${postId}`,
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
              "Postarea nu a putut fi ștearsă."
          );
        }

        return {
          success: true,
          message:
            data?.message ||
            "Postarea a fost ștearsă.",
        };
      } catch (deleteError) {
        console.error(
          "Eroare la ștergerea postării:",
          deleteError
        );

        const message =
          deleteError?.message ||
          "Postarea nu a putut fi ștearsă.";

        setActionError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setIsDeleting(false);
      }
    }, [isDeleting, postId]);

  const toggleSavedPost =
    useCallback(async () => {
      if (!postId || isSaveLoading) {
        return {
          success: false,
        };
      }

      try {
        setIsSaveLoading(true);
        setActionError("");

        const response = await fetch(
          `/api/posts/${postId}/save`,
          {
            method: "POST",
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
              "Postarea nu a putut fi salvată."
          );
        }

        const nextSavedState = Boolean(
          data?.isSaved
        );

        setIsSaved(nextSavedState);

        return {
          success: true,
          isSaved: nextSavedState,
          message:
            data?.message ||
            (nextSavedState
              ? "Postarea a fost salvată."
              : "Postarea a fost eliminată din salvate."),
        };
      } catch (saveError) {
        console.error(
          "Eroare la salvarea postării:",
          saveError
        );

        const message =
          saveError?.message ||
          "Postarea nu a putut fi salvată.";

        setActionError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setIsSaveLoading(false);
      }
    }, [isSaveLoading, postId]);

  useEffect(() => {
    let isMounted = true;

    async function initializePage() {
      if (!isMounted) {
        return;
      }

      await loadPostDetails();
    }

    initializePage();

    return () => {
      isMounted = false;
    };
  }, [loadPostDetails]);

  return {
    post,
    setPost,

    currentUser,

    loading,
    error,
    actionError,
    isDeleting,
    isSaved,
    isSaveLoading,

    setError,
    setActionError,

    deletePost,
    toggleSavedPost,
    refetchPost: loadPostDetails,
  };
}