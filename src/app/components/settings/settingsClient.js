"use client";

/* eslint-disable @next/next/no-img-element -- Avatar dinamic cu fallback manual la inițiale în evenimentul onError. */

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  AtSign,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { useToast } from "../toast/toastProvider";
import { getUserInitials } from "../../utils/getUserInitials";
import SettingsDialog from "./settingsDialog";

async function requestJson(url, options) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const contentType =
    response.headers.get("content-type") || "";
  const data = contentType.includes(
    "application/json"
  )
    ? await response.json()
    : null;

  if (!response.ok || !data?.success) {
    const error = new Error(
      data?.message ||
        "Cererea nu a putut fi procesată."
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
}) {
  const [isVisible, setIsVisible] =
    useState(false);

  return (
    <label className="settings-field" htmlFor={id}>
      <span>{label}</span>
      <div className="settings-password-input">
        <LockKeyhole size={18} aria-hidden="true" />
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
          required
        />
        <button
          type="button"
          onClick={() =>
            setIsVisible((current) => !current)
          }
          disabled={disabled}
          aria-label={
            isVisible
              ? "Ascunde parola"
              : "Arată parola"
          }
        >
          {isVisible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </label>
  );
}

export default function SettingsClient() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [failedAvatarUrl, setFailedAvatarUrl] =
    useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] =
    useState(false);
  const [sessionPassword, setSessionPassword] =
    useState("");
  const [isRevokingSessions, setIsRevokingSessions] =
    useState(false);
  const [isDeleteOpen, setIsDeleteOpen] =
    useState(false);
  const [deletePassword, setDeletePassword] =
    useState("");
  const [deleteConfirmation, setDeleteConfirmation] =
    useState("");
  const [isDeleting, setIsDeleting] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const data = await requestJson(
          "/api/auth/me",
          { method: "GET", headers: {} }
        );
        if (isMounted) {
          setUser(data.user);
        }
      } catch (error) {
        if (error.status === 401) {
          router.replace("/login");
          return;
        }
        if (isMounted) {
          setLoadError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  function updatePasswordField(field, value) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (isChangingPassword) return;

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      toast.error("Parolele noi nu coincid.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const data = await requestJson(
        "/api/settings/password",
        {
          method: "PUT",
          body: JSON.stringify(passwordForm),
        }
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleRevokeSessions(event) {
    event.preventDefault();
    if (isRevokingSessions) return;

    setIsRevokingSessions(true);
    try {
      const data = await requestJson(
        "/api/settings/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: sessionPassword,
          }),
        }
      );
      setSessionPassword("");
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsRevokingSessions(false);
    }
  }

  const closeDeleteDialog = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteOpen(false);
    setDeletePassword("");
    setDeleteConfirmation("");
  }, [isDeleting]);

  async function handleDeleteAccount(event) {
    event.preventDefault();
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await requestJson(
        "/api/settings/account",
        {
          method: "DELETE",
          body: JSON.stringify({
            password: deletePassword,
            confirmation: deleteConfirmation,
          }),
        }
      );
      window.location.replace("/");
    } catch (error) {
      toast.error(error.message);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="settings-state">Se încarcă setările...</div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="settings-state settings-state-error">
        {loadError || "Contul nu este disponibil."}
      </div>
    );
  }

  const avatarUrl =
    typeof user.avatar === "string"
      ? user.avatar
      : user.avatar?.url || "";
  const shouldShowAvatar =
    Boolean(avatarUrl) &&
    failedAvatarUrl !== avatarUrl;

  return (
    <div className="settings-page">
      <div className="settings-shell">
        <header className="settings-heading">
          <div className="settings-heading-icon">
            <ShieldCheck size={28} aria-hidden="true" />
          </div>
          <div>
            <span>CONTUL TĂU</span>
            <h1>Setări și securitate</h1>
            <p>Gestionează accesul și protecția contului tău.</p>
          </div>
        </header>

        <section className="settings-card settings-account-card">
          <div className="settings-avatar">
            {shouldShowAvatar ? (
              <img
                src={avatarUrl}
                alt=""
                onError={() =>
                  setFailedAvatarUrl(avatarUrl)
                }
              />
            ) : (
              getUserInitials(user)
            )}
          </div>
          <div className="settings-account-info">
            <h2>{user.name}</h2>
            <p><AtSign size={16} /> @{user.username}</p>
            <p><Mail size={16} /> {user.email}</p>
          </div>
          <button
            type="button"
            className="settings-secondary-button"
            onClick={() => router.push("/profile")}
          >
            <UserRound size={18} /> Vezi profilul
          </button>
        </section>

        <div className="settings-grid">
          <section className="settings-card">
            <div className="settings-card-title">
              <span><KeyRound size={22} /></span>
              <div>
                <h2>Schimbă parola</h2>
                <p>Poți schimba parola oricând.</p>
              </div>
            </div>

            <form className="settings-form" onSubmit={handlePasswordSubmit}>
              <PasswordInput
                id="current-password"
                label="Parola actuală"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  updatePasswordField("currentPassword", event.target.value)
                }
                autoComplete="current-password"
                disabled={isChangingPassword}
              />
              <PasswordInput
                id="new-password"
                label="Parola nouă"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  updatePasswordField("newPassword", event.target.value)
                }
                autoComplete="new-password"
                disabled={isChangingPassword}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirmă parola nouă"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  updatePasswordField("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
                disabled={isChangingPassword}
              />
              <p className="settings-help">
                8–64 caractere, literă mică, literă mare, cifră și @.
              </p>
              <button className="settings-primary-button" disabled={isChangingPassword}>
                <Check size={18} />
                {isChangingPassword ? "Se schimbă..." : "Schimbă parola"}
              </button>
            </form>
          </section>

          <section className="settings-card">
            <div className="settings-card-title">
              <span><MonitorSmartphone size={22} /></span>
              <div>
                <h2>Dispozitive conectate</h2>
                <p>Închide toate celelalte sesiuni active.</p>
              </div>
            </div>
            <form className="settings-form" onSubmit={handleRevokeSessions}>
              <PasswordInput
                id="sessions-password"
                label="Confirmă parola actuală"
                value={sessionPassword}
                onChange={(event) => setSessionPassword(event.target.value)}
                autoComplete="current-password"
                disabled={isRevokingSessions}
              />
              <p className="settings-help">
                Dispozitivul folosit acum va rămâne conectat.
              </p>
              <button className="settings-secondary-button" disabled={isRevokingSessions}>
                <MonitorSmartphone size={18} />
                {isRevokingSessions ? "Se deconectează..." : "Deconectează celelalte dispozitive"}
              </button>
            </form>
          </section>
        </div>

        <section className="settings-card settings-danger-card">
          <div className="settings-card-title">
            <span><AlertTriangle size={22} /></span>
            <div>
              <h2>Ștergerea contului</h2>
              <p>Datele personale vor fi eliminate definitiv, iar conținutul public va fi anonimizat.</p>
            </div>
          </div>
          <button
            type="button"
            className="settings-danger-button"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 size={18} /> Șterge contul
          </button>
        </section>
      </div>

      <SettingsDialog
        isOpen={isDeleteOpen}
        title="Șterge definitiv contul"
        description="Această acțiune nu poate fi anulată."
        onClose={closeDeleteDialog}
      >
        <form className="settings-dialog-body" onSubmit={handleDeleteAccount}>
          <div className="settings-delete-warning">
            <AlertTriangle size={21} />
            <p>Profilul și datele personale vor dispărea. Postările, comentariile și mesajele vor rămâne anonimizate.</p>
          </div>
          <PasswordInput
            id="delete-password"
            label="Parola actuală"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            autoComplete="current-password"
            disabled={isDeleting}
          />
          <label className="settings-field" htmlFor="delete-confirmation">
            <span>Scrie exact STERGE CONTUL</span>
            <input
              id="delete-confirmation"
              className="settings-text-input"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              disabled={isDeleting}
              autoComplete="off"
              required
            />
          </label>
          <div className="settings-dialog-actions">
            <button type="button" className="settings-secondary-button" onClick={closeDeleteDialog} disabled={isDeleting}>
              Anulează
            </button>
            <button className="settings-danger-button" disabled={
              isDeleting ||
              !deletePassword ||
              deleteConfirmation.trim().toUpperCase() !== "STERGE CONTUL"
            }>
              <Trash2 size={18} />
              {isDeleting ? "Se șterge..." : "Șterge definitiv"}
            </button>
          </div>
        </form>
      </SettingsDialog>
    </div>
  );
}
