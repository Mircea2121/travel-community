import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Network } from "@capacitor/network";
import { Share } from "@capacitor/share";
import {
  Bell,
  Compass,
  Heart,
  Home,
  ImagePlus,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  UserRound,
} from "lucide-react";

import { API_BASE_URL, getFeed } from "./api";

const tabs = [
  { id: "home", label: "Acasă", icon: Home },
  { id: "discover", label: "Descoperă", icon: Compass },
  { id: "create", label: "Adaugă", icon: Plus, primary: true },
  { id: "messages", label: "Mesaje", icon: MessageCircle },
  { id: "profile", label: "Profil", icon: UserRound },
];

function PostCard({ post }) {
  const image = post.images?.[0];
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
      {image ? <img className="post-image" src={image} alt={post.title || "Experiență de călătorie"} /> : <div className="post-image placeholder"><ImagePlus size={34} /></div>}
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
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    let removeListener = () => {};

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (activeTab !== "home") {
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
  }, [activeTab]);

  const selectTab = async (tab) => {
    setActiveTab(tab.id);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  };

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
        {activeTab !== "home" && <section className="coming-soon"><div className="coming-icon">{activeTab === "create" ? <Plus /> : activeTab === "messages" ? <MessageCircle /> : activeTab === "profile" ? <UserRound /> : <Compass />}</div><h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2><p>Construim această secțiune ca experiență mobilă dedicată.</p></section>}
      </main>

      <nav className="tab-bar" aria-label="Navigare principală">
        {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={`${activeTab === tab.id ? "active" : ""} ${tab.primary ? "primary" : ""}`} onClick={() => selectTab(tab)}><span><Icon size={tab.primary ? 27 : 22} /></span><small>{tab.label}</small></button>; })}
      </nav>
    </div>
  );
}
