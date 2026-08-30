import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Network } from "@capacitor/network";
import { Share } from "@capacitor/share";
import {
  Bell,
  ArrowLeft,
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
} from "lucide-react";

import {
  API_BASE_URL,
  getFeed,
  getSession,
  login,
  logout,
  register,
  requestPasswordReset,
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

function PostCard({ post }) {
  const image = post.images?.[0];
  const imageUrl = typeof image === "string" ? image : image?.url;
  const authorName = post.author?.name || post.name || post.username || "Călător";

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
        <button className="quiet-button" aria-label="Trimite postarea" onClick={sharePost}><Send size={20} /></button>
      </header>
      {imageUrl ? <img className="post-image" src={imageUrl} alt={post.title || "Experiență de călătorie"} /> : <div className="post-image placeholder"><ImagePlus size={34} /></div>}
      <div className="post-content">
        <h2>{post.title || post.destination || "Experiență nouă"}</h2>
        <p>{post.description}</p>
        <div className="post-actions">
          <span><Heart size={19} /> {post.likesCount || 0}</span>
          <span><MessageCircle size={19} /> {post.commentsCount || 0}</span>
        </div>
      </div>
    </article>
  );
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
    loadFeed();
  };

  const handleLogout = async () => {
    await logout().catch(() => {});
    setCurrentUser(null);
    setSessionStatus("guest");
    setGuestMode(false);
    setActiveTab("home");
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
          {posts.map((post) => <PostCard key={post.id || post._id} post={post} />)}
        </>}
        {activeTab === "profile" && <section className="profile-card"><div className="profile-avatar">{(currentUser?.name || "Vizitator").slice(0, 1).toUpperCase()}</div><h2>{currentUser?.name || "Mod vizitator"}</h2><p>{currentUser?.email || "Conectează-te pentru acces la profil și postări salvate."}</p>{currentUser ? <button onClick={handleLogout}><LogOut size={18} /> Deconectează-te</button> : <button onClick={() => setGuestMode(false)}><LogIn size={18} /> Autentifică-te</button>}</section>}
        {activeTab !== "home" && activeTab !== "profile" && <section className="coming-soon"><div className="coming-icon">{activeTab === "create" ? <Plus /> : activeTab === "messages" ? <MessageCircle /> : <Compass />}</div><h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2><p>Construim această secțiune ca experiență mobilă dedicată.</p></section>}
      </main>

      <nav className="tab-bar" aria-label="Navigare principală">
        {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={`${activeTab === tab.id ? "active" : ""} ${tab.primary ? "primary" : ""}`} onClick={() => selectTab(tab)}><span><Icon size={tab.primary ? 27 : 22} /></span><small>{tab.label}</small></button>; })}
      </nav>
    </div>
  );
}
