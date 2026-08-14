"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3, ClipboardList, FileText, Headphones, RefreshCw,
  Search, ShieldCheck, Users, XCircle,
} from "lucide-react";
import "./adminPanel.css";

const TABS = [
  { id: "overview", label: "Dashboard", icon: BarChart3 },
  { id: "posts", label: "Postări", icon: FileText },
  { id: "reports", label: "Raportări", icon: ShieldCheck },
  { id: "support", label: "Suport", icon: Headphones },
  { id: "users", label: "Utilizatori", icon: Users },
  { id: "audit", label: "Jurnal", icon: ClipboardList },
];

async function readJson(response) {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Serverul a trimis un răspuns neașteptat.");
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Cererea nu a putut fi procesată.");
  return data;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Empty({ children }) { return <div className="admin-empty">{children}</div>; }

export default function AdminPanel() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      if (tab === "users" && query.trim()) params.set("q", query.trim());
      const url = tab === "overview" ? "/api/admin/overview" : `/api/admin/${tab}?${params}`;
      setData(await readJson(await fetch(url, { cache: "no-store" })));
    } catch (err) { setError(err.message); setData(null); }
    finally { setLoading(false); }
  }, [tab, query, status, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  function changeTab(next) { setTab(next); setQuery(""); setStatus(""); setPage(1); setData(null); }

  async function patch(path, body) {
    setError("");
    try {
      await readJson(await fetch(path, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }));
      await load();
    } catch (err) { setError(err.message); }
  }

  function resolveReport(item, nextStatus) {
    const resolution = window.prompt("Explicația deciziei:", "");
    if (resolution === null) return;
    patch(`/api/admin/reports/${item._id}`, { status: nextStatus, resolution });
  }

  function updateSupport(item, nextStatus) {
    const internalNote = window.prompt("Notă internă (opțional):", item.internalNote || "");
    if (internalNote === null) return;
    patch(`/api/admin/support/${item._id}`, { status: nextStatus, internalNote });
  }

  function updateUser(item) {
    const suspended = item.accountStatus === "suspended";
    const reason = suspended ? "" : window.prompt("Motivul suspendării:", "");
    if (!suspended && reason === null) return;
    patch(`/api/admin/users/${item._id}`, { action: suspended ? "reactivate" : "suspend", reason });
  }

  const overview = data?.overview;
  const cards = overview ? [
    ["Utilizatori", overview.users], ["Conturi noi azi", overview.newUsersToday],
    ["Postări", overview.posts], ["Postări în 7 zile", overview.postsLast7Days],
    ["Raportări în așteptare", overview.pendingReports], ["Solicitări noi", overview.newSupportRequests],
    ["Comentarii", overview.comments], ["Mesaje", overview.messages],
  ] : [];

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div><span>Administrare securizată</span><h1>Panou de control</h1><p>Moderare, suport și activitatea platformei într-un singur loc.</p></div>
          <button type="button" onClick={load} disabled={loading}><RefreshCw size={18} /> Actualizează</button>
        </header>

        <nav className="admin-tabs" aria-label="Secțiuni administrare">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => changeTab(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        {tab !== "overview" && tab !== "posts" && tab !== "audit" && (
          <div className="admin-filters">
            {tab === "users" && <label><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nume, username sau email" /></label>}
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Status implicit</option><option value="all">Toate</option>
              {tab === "reports" && <><option value="pending">În așteptare</option><option value="reviewing">În verificare</option><option value="resolved">Rezolvate</option><option value="dismissed">Respinse</option></>}
              {tab === "support" && <><option value="new">Noi</option><option value="in_progress">În lucru</option><option value="resolved">Rezolvate</option><option value="closed">Închise</option></>}
              {tab === "users" && <><option value="active">Active</option><option value="suspended">Suspendate</option></>}
            </select>
          </div>
        )}

        {error && <div className="admin-error"><XCircle size={18} />{error}</div>}
        {loading ? <div className="admin-loading">Se încarcă…</div> : (
          <section className="admin-content">
            {tab === "overview" && <div className="admin-stat-grid">{cards.map(([label, value]) => <article key={label}><strong>{Number(value || 0).toLocaleString("ro-RO")}</strong><span>{label}</span></article>)}</div>}
            {tab === "posts" && (data?.posts?.length ? <div className="admin-list">{data.posts.map((item) => <article key={item._id} className="admin-item"><div><span className="admin-badge">{item.category || "postare"}</span><h2>{item.title || "Postare fără titlu"}</h2><p>{item.destination}{item.country ? ` · ${item.country}` : ""}</p><small>{formatDate(item.createdAt)} · @{item.authorUsername || "utilizator"}</small></div></article>)}</div> : <Empty>Nu există postări.</Empty>)}
            {tab === "reports" && (data?.reports?.length ? <div className="admin-list">{data.reports.map((item) => <article key={item._id} className="admin-item"><div><span className="admin-badge">{item.targetType}</span><h2>{item.targetPreview || "Conținut raportat"}</h2><p><strong>Motiv:</strong> {item.reason}</p>{item.details && <p>{item.details}</p>}<small>{formatDate(item.createdAt)} · @{item.reportedByUsername || "utilizator"}</small></div><div className="admin-actions"><button onClick={() => patch(`/api/admin/reports/${item._id}`, { status: "reviewing", resolution: "" })}>Preia</button><button onClick={() => resolveReport(item, "resolved")}>Rezolvă</button><button className="danger" onClick={() => resolveReport(item, "dismissed")}>Respinge</button></div></article>)}</div> : <Empty>Nu există raportări în această categorie.</Empty>)}
            {tab === "support" && (data?.requests?.length ? <div className="admin-list">{data.requests.map((item) => <article key={item._id} className="admin-item"><div><span className="admin-badge">{item.reference}</span><h2>{item.subject}</h2><p>{item.message}</p><small>{item.name} · {item.email} · {formatDate(item.createdAt)}</small></div><div className="admin-actions"><button onClick={() => updateSupport(item, "in_progress")}>Preia</button><button onClick={() => updateSupport(item, "resolved")}>Rezolvă</button><button onClick={() => updateSupport(item, "closed")}>Închide</button></div></article>)}</div> : <Empty>Nu există solicitări în această categorie.</Empty>)}
            {tab === "users" && (data?.users?.length ? <div className="admin-list">{data.users.map((item) => <article key={item._id} className="admin-item"><div><span className={`admin-badge ${item.accountStatus === "suspended" ? "red" : ""}`}>{item.accountStatus === "suspended" ? "Suspendat" : "Activ"}</span><h2>{item.name || item.username}</h2><p>@{item.username} · {item.email}</p><small>Creat: {formatDate(item.createdAt)} · Rol: {item.role || "user"}</small>{item.suspensionReason && <p><strong>Motiv:</strong> {item.suspensionReason}</p>}</div><div className="admin-actions"><button className={item.accountStatus === "suspended" ? "" : "danger"} onClick={() => updateUser(item)}>{item.accountStatus === "suspended" ? "Reactivează" : "Suspendă"}</button></div></article>)}</div> : <Empty>Nu au fost găsiți utilizatori.</Empty>)}
            {tab === "audit" && (data?.logs?.length ? <div className="admin-list">{data.logs.map((item) => <article key={item._id} className="admin-item"><div><span className="admin-badge">{item.action}</span><h2>{item.targetType}</h2><p>Administrator: @{item.adminUsername || "admin"}</p><small>{formatDate(item.createdAt)}</small></div></article>)}</div> : <Empty>Jurnalul este gol.</Empty>)}
          </section>
        )}
        {!loading && data?.pagination && (
          <div className="admin-actions">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
            <span>Pagina {data.pagination.page} din {data.pagination.pages}</span>
            <button type="button" disabled={page >= data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Următor</button>
          </div>
        )}
      </div>
    </main>
  );
}
