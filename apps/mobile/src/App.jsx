import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { App as CapacitorApp } from "@capacitor/app";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Network } from "@capacitor/network";
import { Share } from "@capacitor/share";
import {
  Bell,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Heart,
  Home,
  ImagePlus,
  MapPin,
  Mail,
  MessageCircle,
  Plus,
  LockKeyhole,
  LogIn,
  LogOut,
  Search,
  Send,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";

import {
  API_BASE_URL,
  getFeed,
  getSession,
  login,
  logout,
  register,
  requestPasswordReset,
  setPostLike,
  toggleSavedPost,
  getComments,
  addComment,
  getSavedPosts,
  createExperience,
} from "./api";
import Turnstile from "./Turnstile";

const tabs = [
  { id: "home", label: "Acasă", icon: Home },
  { id: "discover", label: "Descoperă", icon: Compass },
  { id: "create", label: "Adaugă", icon: Plus, primary: true },
  { id: "messages", label: "Mesaje", icon: MessageCircle },
  { id: "profile", label: "Profil", icon: UserRound },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthScreen({ onAuthenticated, onContinueAsGuest, onForgotPassword, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const securityConfigured = Boolean(
    import.meta.env.VITE_TURNSTILE_SITE_KEY
  );
  const normalizedEmail = email.trim().toLowerCase();
  const isValid =
    EMAIL_PATTERN.test(normalizedEmail) &&
    password.length > 0 &&
    (!securityConfigured || turnstileToken);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const payload = await login({
        email: normalizedEmail,
        password,
        turnstileToken,
      });
      onAuthenticated(payload.user);
    } catch (requestError) {
      setError(requestError.message);
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-hero">
        <div className="brand-mark">CC</div>
        <span className="eyebrow">COMUNITATEA CĂLĂTORILOR</span>
        <h1>Călătorește.<br />Povestește. Inspiră.</h1>
        <p>Locul în care experiențele tale îi ajută pe alții să descopere lumea.</p>
      </section>

      <section className="login-sheet">
        <div className="sheet-handle" />
        <h2>Bine ai revenit</h2>
        <p>Conectează-te pentru a continua.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="mobile-email">Adresă de email</label>
          <div className="input-shell"><Mail size={19} /><input id="mobile-email" type="email" inputMode="email" autoComplete="email" placeholder="exemplu@email.ro" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <label htmlFor="mobile-password">Parolă</label>
          <div className="input-shell"><LockKeyhole size={19} /><input id="mobile-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Introdu parola" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ascunde parola" : "Arată parola"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
          <button className="forgot-link" type="button" onClick={onForgotPassword}>Ai uitat parola?</button>
          <Turnstile action="login" onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="login-button" type="submit" disabled={!isValid || isSubmitting}><LogIn size={19} /> {isSubmitting ? "Se conectează…" : "Autentifică-te"}</button>
        </form>
        <button className="guest-button" type="button" onClick={onContinueAsGuest}>Continuă fără cont</button>
        <p className="register-copy">Nu ai cont? <button type="button" onClick={onRegister}>Creează unul</button></p>
      </section>
    </main>
  );
}

function RegisterScreen({ onBack }) {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirmPassword: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const securityConfigured = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const passwordIsValid = form.password.length >= 8 && form.password.length <= 64 && /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) && /\d/.test(form.password) && form.password.includes("@");
  const isValid = form.name.trim().length >= 2 && /^[a-z0-9._]{3,20}$/.test(form.username) && EMAIL_PATTERN.test(form.email.trim()) && passwordIsValid && form.password === form.confirmPassword && acceptedTerms && (!securityConfigured || turnstileToken);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: field === "username" ? value.toLowerCase().replace(/\s/g, "") : value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!isValid || status === "loading") return;
    setStatus("loading"); setMessage("");
    try {
      const payload = await register({ name: form.name.trim(), username: form.username, email: form.email.trim().toLowerCase(), password: form.password, turnstileToken });
      setMessage(payload.message); setStatus("success");
    } catch (error) {
      setMessage(error.message); setStatus("error"); setTurnstileToken(""); setResetKey((value) => value + 1);
    }
  };

  if (status === "success") return <AuthResult icon={<CheckCircle2 />} title="Cont creat" message={message} action="Înapoi la autentificare" onAction={onBack} />;

  return <main className="auth-form-screen"><AuthHeader title="Creează cont" subtitle="Alătură-te comunității călătorilor." onBack={onBack} /><form className="mobile-auth-form" onSubmit={submit}>
    <Field label="Numele tău" value={form.name} onChange={(value) => update("name", value)} autoComplete="name" placeholder="Mircea Chiriță" />
    <Field label="Nume de utilizator" value={form.username} onChange={(value) => update("username", value)} autoComplete="username" placeholder="mircea27" />
    <Field label="Adresă de email" type="email" value={form.email} onChange={(value) => update("email", value)} autoComplete="email" placeholder="exemplu@email.ro" />
    <PasswordField label="Parolă" value={form.password} onChange={(value) => update("password", value)} show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" />
    <p className={`password-hint ${form.password && !passwordIsValid ? "invalid" : ""}`}>8–64 caractere, literă mare, literă mică, cifră și @.</p>
    <PasswordField label="Confirmă parola" value={form.confirmPassword} onChange={(value) => update("confirmPassword", value)} show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" />
    <label className="terms-row"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /><span>Sunt de acord cu termenii, regulamentul și politica de confidențialitate.</span></label>
    <Turnstile action="register" onTokenChange={setTurnstileToken} resetKey={resetKey} />
    {status === "error" && <p className="form-error" role="alert">{message}</p>}
    <button className="login-button" disabled={!isValid || status === "loading"}><UserPlus size={19} />{status === "loading" ? "Se creează…" : "Creează cont"}</button>
  </form></main>;
}

function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState(""); const [token, setToken] = useState(""); const [resetKey, setResetKey] = useState(0); const [status, setStatus] = useState("idle"); const [message, setMessage] = useState("");
  const securityConfigured = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const isValid = EMAIL_PATTERN.test(email.trim()) && (!securityConfigured || token);
  const submit = async (event) => { event.preventDefault(); if (!isValid || status === "loading") return; setStatus("loading"); setMessage(""); try { const payload = await requestPasswordReset({ email: email.trim().toLowerCase(), turnstileToken: token }); setMessage(payload.message); setStatus("success"); } catch (error) { setMessage(error.message); setStatus("error"); setToken(""); setResetKey((value) => value + 1); } };
  if (status === "success") return <AuthResult icon={<Mail />} title="Verifică emailul" message={message} action="Înapoi la autentificare" onAction={onBack} />;
  return <main className="auth-form-screen"><AuthHeader title="Recuperează parola" subtitle="Îți trimitem un link securizat prin email." onBack={onBack} /><form className="mobile-auth-form" onSubmit={submit}><Field label="Adresă de email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="exemplu@email.ro" /><Turnstile action="forgot-password" onTokenChange={setToken} resetKey={resetKey} />{status === "error" && <p className="form-error" role="alert">{message}</p>}<button className="login-button" disabled={!isValid || status === "loading"}><Mail size={19} />{status === "loading" ? "Se trimite…" : "Trimite linkul"}</button></form></main>;
}

function AuthHeader({ title, subtitle, onBack }) { return <header className="mobile-auth-header"><button onClick={onBack} aria-label="Înapoi"><ArrowLeft /></button><div className="brand-mark small">CC</div><h1>{title}</h1><p>{subtitle}</p></header>; }
function Field({ label, type = "text", value, onChange, ...props }) { return <label className="mobile-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} {...props} /></label>; }
function PasswordField({ label, value, onChange, show, onToggle, autoComplete }) { return <label className="mobile-field"><span>{label}</span><div className="plain-password"><input type={show ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder="Introdu parola" /><button type="button" onClick={onToggle} aria-label={show ? "Ascunde parola" : "Arată parola"}>{show ? <EyeOff /> : <Eye />}</button></div></label>; }
function AuthResult({ icon, title, message, action, onAction }) { return <main className="auth-result"><div className="result-icon">{icon}</div><h1>{title}</h1><p>{message}</p><button className="login-button" onClick={onAction}>{action}</button></main>; }

function PostCard({ post, isAuthenticated, onRequireAuth, onUpdate, onOpenComments }) {
  const image = post.images?.[0];
  const imageUrl = typeof image === "string" ? image : image?.url;
  const authorName = post.author?.name || post.name || post.username || "Călător";
  const postId = post.id || post._id;
  const [busyAction, setBusyAction] = useState("");
  const [actionError, setActionError] = useState("");

  const requireAccount = () => {
    if (isAuthenticated) return true;
    onRequireAuth();
    return false;
  };

  const toggleLike = async () => {
    if (!requireAccount() || busyAction) return;
    setActionError("");
    setBusyAction("like");
    try {
      const payload = await setPostLike(postId, post.isLiked);
      onUpdate(postId, { isLiked: payload.liked, likesCount: payload.likesCount });
      if (Capacitor.isNativePlatform()) await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch (error) { setActionError(error.message); } finally { setBusyAction(""); }
  };

  const toggleSave = async () => {
    if (!requireAccount() || busyAction) return;
    setActionError("");
    setBusyAction("save");
    try {
      const payload = await toggleSavedPost(postId);
      onUpdate(postId, { isSaved: payload.isSaved, savesCount: payload.savesCount });
    } catch (error) { setActionError(error.message); } finally { setBusyAction(""); }
  };

  const sharePost = async () => {
    const url = `${API_BASE_URL || window.location.origin}/posts/${post.id || post._id}`;
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: post.title, text: post.description, url });
      return;
    }
    await navigator.share?.({ title: post.title, text: post.description, url });
  };

  return (
    <article className="post-card">
      <header className="post-author">
        <div className="avatar">{authorName.slice(0, 1).toUpperCase()}</div>
        <div><strong>{authorName}</strong><span><MapPin size={13} /> {post.destination || post.country || "În călătorie"}</span></div>
        <div className="card-tools"><button className={`quiet-button ${post.isSaved ? "selected" : ""}`} aria-label={post.isSaved ? "Elimină din salvate" : "Salvează postarea"} onClick={toggleSave} disabled={Boolean(busyAction)}><Bookmark size={20} fill={post.isSaved ? "currentColor" : "none"} /></button><button className="quiet-button" aria-label="Trimite postarea" onClick={sharePost}><Send size={20} /></button></div>
      </header>
      {imageUrl ? <img className="post-image" src={imageUrl} alt={post.title || "Experiență de călătorie"} /> : <div className="post-image placeholder"><ImagePlus size={34} /></div>}
      <div className="post-content">
        <h2>{post.title || post.destination || "Experiență nouă"}</h2>
        <p>{post.description}</p>
        <div className="post-actions">
          <button className={post.isLiked ? "selected" : ""} onClick={toggleLike} disabled={Boolean(busyAction)}><Heart size={19} fill={post.isLiked ? "currentColor" : "none"} /> {post.likesCount || 0}</button>
          <button onClick={() => onOpenComments(post)}><MessageCircle size={19} /> {post.commentsCount || 0}</button>
        </div>
        {actionError && <p className="card-error" role="alert">{actionError}</p>}
      </div>
    </article>
  );
}

function CommentsSheet({ post, isAuthenticated, onRequireAuth, onClose, onCommentAdded }) {
  const postId = post.id || post._id;
  const [comments, setComments] = useState([]); const [status, setStatus] = useState("loading"); const [content, setContent] = useState(""); const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { getComments(postId).then((payload) => { setComments(payload.comments || []); setStatus("ready"); }).catch((requestError) => { setError(requestError.message); setStatus("error"); }); }, [postId]);
  const submit = async (event) => { event.preventDefault(); if (!isAuthenticated) { onClose(); onRequireAuth(); return; } const normalized = content.trim(); if (!normalized || submitting) return; setSubmitting(true); setError(""); try { const payload = await addComment(postId, normalized); setComments((current) => [payload.comment, ...current]); setContent(""); onCommentAdded(postId, payload.commentsCount); } catch (requestError) { setError(requestError.message); } finally { setSubmitting(false); } };
  return <div className="sheet-backdrop" onClick={onClose}><section className="comments-sheet" onClick={(event) => event.stopPropagation()}><header><div><span>COMENTARII</span><h2>{post.title || post.destination}</h2></div><button onClick={onClose} aria-label="Închide"><X /></button></header><form className="comment-form" onSubmit={submit}><input value={content} onChange={(event) => setContent(event.target.value)} maxLength={1500} placeholder={isAuthenticated ? "Scrie un comentariu…" : "Autentifică-te pentru a comenta"} readOnly={!isAuthenticated} onFocus={() => { if (!isAuthenticated) { onClose(); onRequireAuth(); } }} /><button disabled={!content.trim() || submitting}><Send size={19} /></button></form>{error && <p className="form-error">{error}</p>}<div className="comments-list">{status === "loading" && <p>Încărcăm comentariile…</p>}{status === "ready" && comments.length === 0 && <p>Fii primul care lasă un comentariu.</p>}{comments.map((comment) => <article key={comment._id}><div className="avatar small-avatar">{(comment.name || comment.username || "C").slice(0, 1).toUpperCase()}</div><div><strong>{comment.name || comment.username || "Călător"}</strong><p>{comment.content}</p></div></article>)}</div></section></div>;
}

const experienceCategories = [
  ["plaja", "Plajă"], ["city-break", "City break"], ["munte", "Munte"], ["mancare", "Mâncare"],
  ["aventura", "Aventură"], ["cultura", "Cultură"], ["familie", "Familie"], ["buget-redus", "Buget redus"],
];

function CreateExperience({ onPublished }) {
  const [form, setForm] = useState({ title: "", destination: "", country: "", city: "", category: "", travelPeriod: "", totalCost: "", tips: "", description: "" });
  const [images, setImages] = useState([]); const [status, setStatus] = useState("idle"); const [error, setError] = useState("");
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const isValid = form.title.trim().length >= 5 && form.destination.trim() && form.country.trim() && form.category && form.tips.trim().length >= 10 && form.description.trim().length >= 20 && images.length > 0;

  const choosePhoto = async () => {
    if (images.length >= 5) return;
    setError("");
    try {
      const photo = await Camera.getPhoto({ source: CameraSource.Photos, resultType: CameraResultType.Base64, quality: 80, width: 1600, correctOrientation: true });
      if (!photo.base64String) throw new Error("Fotografia nu a putut fi citită.");
      const type = photo.format === "png" ? "image/png" : photo.format === "webp" ? "image/webp" : "image/jpeg";
      setImages((current) => [...current, { id: `${Date.now()}-${current.length}`, type, base64: photo.base64String, preview: `data:${type};base64,${photo.base64String}` }]);
    } catch (requestError) {
      if (!String(requestError?.message || "").toLowerCase().includes("cancel")) setError(requestError.message || "Galeria nu a putut fi deschisă.");
    }
  };

  const submit = async (event) => {
    event.preventDefault(); if (!isValid || status === "loading") return; setStatus("loading"); setError("");
    try {
      const payload = await createExperience({ ...form, totalCost: form.totalCost.replace(/\D/g, ""), images: images.map(({ type, base64 }) => ({ type, base64 })) });
      onPublished({ ...payload.post, id: payload.post._id, isLiked: false, isSaved: false });
    } catch (requestError) { setError(requestError.message); setStatus("error"); }
  };

  return <section className="create-experience"><header><span>EXPERIENȚĂ NOUĂ</span><h2>Spune povestea călătoriei</h2><p>Detaliile tale pot inspira următoarea aventură.</p></header><form onSubmit={submit}>
    <Field label="Titlu *" value={form.title} onChange={(value) => update("title", value)} maxLength={120} placeholder="Ex: Un weekend de poveste la Roma" />
    <div className="field-grid"><Field label="Destinație *" value={form.destination} onChange={(value) => update("destination", value)} maxLength={100} placeholder="Roma" /><Field label="Țară *" value={form.country} onChange={(value) => update("country", value)} maxLength={80} placeholder="Italia" /></div>
    <Field label="Oraș sau zonă" value={form.city} onChange={(value) => update("city", value)} maxLength={120} placeholder="Lazio" />
    <label className="mobile-field"><span>Categorie *</span><select value={form.category} onChange={(event) => update("category", event.target.value)}><option value="">Alege categoria</option>{experienceCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <div className="field-grid"><Field label="Perioada" value={form.travelPeriod} onChange={(value) => update("travelPeriod", value)} maxLength={100} placeholder="10–14 august" /><Field label="Cost total (€)" type="number" value={form.totalCost} onChange={(value) => update("totalCost", value)} inputMode="numeric" placeholder="800" /></div>
    <label className="mobile-field"><span>Ponturi utile *</span><textarea value={form.tips} onChange={(event) => update("tips", event.target.value)} maxLength={3000} placeholder="Transport, cazare, locuri de neratat…" /></label>
    <label className="mobile-field"><span>Povestea călătoriei *</span><textarea className="story-input" value={form.description} onChange={(event) => update("description", event.target.value)} maxLength={10000} placeholder="Cum a fost experiența ta?" /></label>
    <div className="photo-section"><div><strong>Fotografii *</strong><span>{images.length}/5</span></div><button type="button" onClick={choosePhoto} disabled={images.length >= 5}><ImagePlus size={20} />Alege din galerie</button>{images.length > 0 && <div className="photo-previews">{images.map((image) => <figure key={image.id}><img src={image.preview} alt="Previzualizare" /><button type="button" aria-label="Elimină fotografia" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}><X size={16} /></button></figure>)}</div>}</div>
    {error && <p className="form-error" role="alert">{error}</p>}<button className="publish-button" disabled={!isValid || status === "loading"}><Send size={20} />{status === "loading" ? "Se publică…" : "Publică experiența"}</button>
  </form></section>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [isOnline, setIsOnline] = useState(true);
  const [sessionStatus, setSessionStatus] = useState("loading");
  const [currentUser, setCurrentUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [commentsPost, setCommentsPost] = useState(null);
  const [profileView, setProfileView] = useState("overview");
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedStatus, setSavedStatus] = useState("idle");

  const loadFeed = useCallback(async () => {
    setStatus("loading");
    try {
      const payload = await getFeed();
      setPosts(payload.posts || []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadFeed();
    let cleanup = () => {};
    Network.getStatus().then(({ connected }) => setIsOnline(connected));
    Network.addListener("networkStatusChange", ({ connected }) => setIsOnline(connected)).then((handle) => { cleanup = () => handle.remove(); });
    return () => cleanup();
  }, [loadFeed]);

  useEffect(() => {
    getSession()
      .then((payload) => {
        setCurrentUser(payload.user);
        setSessionStatus("authenticated");
      })
      .catch((error) => {
        setSessionStatus(error.status === 401 ? "guest" : "guest");
      });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [authView]);

  useEffect(() => {
    if (activeTab !== "profile" || !currentUser || profileView !== "saved" || savedStatus !== "idle") return;
    setSavedStatus("loading");
    getSavedPosts().then((payload) => { setSavedPosts((payload.posts || []).map((post) => ({ ...post, isSaved: true }))); setSavedStatus("ready"); }).catch(() => setSavedStatus("error"));
  }, [activeTab, currentUser, profileView, savedStatus]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    let removeListener = () => {};

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (sessionStatus === "guest" && !guestMode && authView !== "login") {
        setAuthView("login");
      } else if (activeTab !== "home") {
        setActiveTab("home");
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => removeListener();
  }, [activeTab, authView, guestMode, sessionStatus]);

  const selectTab = async (tab) => {
    if (tab.id === "create" && !currentUser) {
      requireAuthentication();
      return;
    }
    setActiveTab(tab.id);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  };

  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    setSessionStatus("authenticated");
    setGuestMode(false);
    setActiveTab("home");
    setSavedPosts([]);
    setSavedStatus("idle");
    loadFeed();
  };

  const handleLogout = async () => {
    await logout().catch(() => {});
    setCurrentUser(null);
    setSessionStatus("guest");
    setGuestMode(false);
    setActiveTab("home");
    setSavedPosts([]);
    setSavedStatus("idle");
  };

  const requireAuthentication = () => {
    setGuestMode(false);
    setAuthView("login");
  };

  const updatePost = (postId, changes) => {
    setPosts((current) => current.map((post) => (post.id || post._id) === postId ? { ...post, ...changes } : post));
    setSavedPosts((current) => changes.isSaved === false ? current.filter((post) => (post.id || post._id) !== postId) : current.map((post) => (post.id || post._id) === postId ? { ...post, ...changes } : post));
  };

  const avatarUrl = typeof currentUser?.avatar === "string" ? currentUser.avatar : currentUser?.avatar?.url;

  const handlePublished = (post) => {
    setPosts((current) => [post, ...current]);
    setActiveTab("home");
    setCurrentUser((user) => user ? { ...user, stats: { ...user.stats, postsCount: (user.stats?.postsCount || 0) + 1 } } : user);
  };

  if (sessionStatus === "loading") {
    return <div className="launch-screen"><div className="brand-mark">CC</div><p>Comunitatea Călătorilor</p></div>;
  }

  if (sessionStatus === "guest" && !guestMode) {
    if (authView === "register") return <RegisterScreen onBack={() => setAuthView("login")} />;
    if (authView === "forgot") return <ForgotPasswordScreen onBack={() => setAuthView("login")} />;
    return <AuthScreen onAuthenticated={handleAuthenticated} onContinueAsGuest={() => setGuestMode(true)} onForgotPassword={() => setAuthView("forgot")} onRegister={() => setAuthView("register")} />;
  }

  return (
    <div className="app-shell">
      {!isOnline && <div className="offline-banner">Ești offline. Unele informații pot fi indisponibile.</div>}
      <header className="top-bar">
        <div><span className="eyebrow">COMUNITATEA</span><h1>Călătorilor</h1></div>
        <div className="top-actions"><button aria-label="Caută"><Search size={22} /></button><button aria-label="Notificări"><Bell size={22} /></button></div>
      </header>

      <main className="screen">
        {activeTab === "home" && <>
          <section className="welcome"><p>Bun venit în comunitate</p><h2>Unde ai vrea să ajungi?</h2><button onClick={() => selectTab(tabs[1])}><Compass size={18} /> Descoperă destinații</button></section>
          <div className="section-heading"><div><span>DIN COMUNITATE</span><h2>Experiențe recente</h2></div></div>
          {status === "loading" && <div className="state-card">Încărcăm experiențele…</div>}
          {status === "error" && <div className="state-card"><p>Feedul nu este disponibil momentan.</p><button onClick={loadFeed}>Încearcă din nou</button></div>}
          {status === "ready" && posts.length === 0 && <div className="state-card">Prima experiență poate fi a ta.</div>}
          {posts.map((post) => <PostCard key={post.id || post._id} post={post} isAuthenticated={Boolean(currentUser)} onRequireAuth={requireAuthentication} onUpdate={updatePost} onOpenComments={setCommentsPost} />)}
        </>}
        {activeTab === "profile" && <>
          <section className="profile-card profile-header-card">
            {avatarUrl ? <img className="profile-avatar photo" src={avatarUrl} alt={`Avatar ${currentUser?.name || "utilizator"}`} /> : <div className="profile-avatar">{(currentUser?.name || "Vizitator").slice(0, 1).toUpperCase()}</div>}
            <h2>{currentUser?.name || "Mod vizitator"}</h2>
            {currentUser?.username && <strong className="profile-username">@{currentUser.username}</strong>}
            <p>{currentUser?.bio || currentUser?.email || "Conectează-te pentru acces la profil și postări salvate."}</p>
            {currentUser?.location && <span className="profile-location"><MapPin size={15} />{currentUser.location}</span>}
            {currentUser && <div className="profile-stats"><div><strong>{currentUser.stats?.postsCount || 0}</strong><span>Postări</span></div><div><strong>{currentUser.stats?.followersCount || 0}</strong><span>Urmăritori</span></div><div><strong>{currentUser.stats?.followingCount || 0}</strong><span>Urmărește</span></div></div>}
            {currentUser ? <button className="logout-button" onClick={handleLogout}><LogOut size={18} /> Deconectează-te</button> : <button onClick={requireAuthentication}><LogIn size={18} /> Autentifică-te</button>}
          </section>
          {currentUser && <div className="profile-tabs"><button className={profileView === "overview" ? "active" : ""} onClick={() => setProfileView("overview")}><UserRound size={18} />Prezentare</button><button className={profileView === "saved" ? "active" : ""} onClick={() => setProfileView("saved")}><Bookmark size={18} />Salvate</button></div>}
          {currentUser && profileView === "overview" && <section className="level-card"><span>NIVELUL TĂU</span><h3>{currentUser.level?.name || "Călător începător"}</h3><p>{currentUser.level?.currentXp || 0} XP acumulate</p></section>}
          {currentUser && profileView === "saved" && <section className="saved-section"><div className="section-heading"><div><span>COLECȚIA TA</span><h2>Postări salvate</h2></div></div>{savedStatus === "loading" && <div className="state-card">Încărcăm postările salvate…</div>}{savedStatus === "error" && <div className="state-card"><p>Postările salvate nu au putut fi încărcate.</p><button onClick={() => setSavedStatus("idle")}>Încearcă din nou</button></div>}{savedStatus === "ready" && savedPosts.length === 0 && <div className="state-card">Nu ai salvat încă nicio experiență.</div>}{savedPosts.map((post) => <PostCard key={post.id || post._id} post={post} isAuthenticated onRequireAuth={requireAuthentication} onUpdate={updatePost} onOpenComments={setCommentsPost} />)}</section>}
        </>}
        {activeTab === "create" && currentUser && <CreateExperience onPublished={handlePublished} />}
        {activeTab !== "home" && activeTab !== "profile" && activeTab !== "create" && <section className="coming-soon"><div className="coming-icon">{activeTab === "messages" ? <MessageCircle /> : <Compass />}</div><h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2><p>Construim această secțiune ca experiență mobilă dedicată.</p></section>}
      </main>

      <nav className="tab-bar" aria-label="Navigare principală">
        {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={`${activeTab === tab.id ? "active" : ""} ${tab.primary ? "primary" : ""}`} onClick={() => selectTab(tab)}><span><Icon size={tab.primary ? 27 : 22} /></span><small>{tab.label}</small></button>; })}
      </nav>
      {commentsPost && <CommentsSheet post={commentsPost} isAuthenticated={Boolean(currentUser)} onRequireAuth={requireAuthentication} onClose={() => setCommentsPost(null)} onCommentAdded={(postId, commentsCount) => updatePost(postId, { commentsCount })} />}
    </div>
  );
}
