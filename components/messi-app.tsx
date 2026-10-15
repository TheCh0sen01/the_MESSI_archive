"use client";

import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from "firebase/auth";
import {
  ArrowDown, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, Clock3,
  Filter, Globe2, LayoutGrid, LockKeyhole, LogOut, Menu, MessageCircle, Plus,
  Search, Send, Shield, Sparkles, Star, Trash2, Trophy, X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { firebaseEnabled, getFirebase } from "@/lib/firebase";
import { Match, seedMatches } from "@/lib/matches";

type AppUser = { uid: string; name: string; email?: string; photo?: string; role: "user" | "admin" };
type Progress = { watched: string[]; saved: string[]; quizPassed: boolean };
type ChatMessage = { id: string; uid: string; name: string; text: string; time: string; createdAt?: unknown };
type View = "matches" | "watchlist" | "community" | "admin";
const emptyProgress: Progress = { watched: [], saved: [], quizPassed: false };
const localKey = "messi-archive-progress-v2";
const quiz = {
  question: "Which country did Messi win his first senior international trophy with?",
  answers: ["Brazil", "Argentina", "Spain", "Uruguay"],
  correct: 1,
};

function readLocal(uid = "preview"): Progress {
  try {
    return { ...emptyProgress, ...JSON.parse(localStorage.getItem(`${localKey}:${uid}`) || "{}") };
  } catch {
    return emptyProgress;
  }
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "2-digit" }).toUpperCase();
}

function MatchRow({
  match, watched, saved, onWatched, onSaved, canDelete, onDelete,
}: {
  match: Match; watched: boolean; saved: boolean; onWatched: () => void; onSaved: () => void;
  canDelete?: boolean; onDelete?: () => void;
}) {
  const directLink = match.url !== "https://footballia.net";
  return (
    <article className="match-row">
      <div className="match-date">{formatDate(match.date)}</div>
      <div className="match-info">
        <b>{match.team} <span className="versus">vs</span> {match.opponent} <span className="score">{match.score}</span></b>
        <small>{match.stage}</small>
      </div>
      <div className="match-comp">{match.competition}</div>
      <span className={`badge ${match.type === "International" ? "intl" : ""}`}>
        {match.type === "International" ? <><Globe2 size={11}/> INTERNATIONAL</> : <><Trophy size={11}/> CLUB</>}
      </span>
      <div className="match-actions">
        <a className="match-link" href={match.url} target="_blank" rel="noreferrer">{directLink ? "Watch" : "Browse"} <ArrowUpRight size={12}/></a>
        <button className={`save-btn ${saved ? "saved" : ""}`} onClick={onSaved} title={saved ? "Remove from watchlist" : "Add to watchlist"} aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}><Star size={16} fill={saved ? "currentColor" : "none"}/></button>
        <button className={`watched-btn ${watched ? "checked" : ""}`} onClick={onWatched} title={watched ? "Mark unwatched" : "Mark watched"} aria-label={watched ? "Mark unwatched" : "Mark watched"}><Check size={13}/></button>
        {canDelete && <button className="save-btn danger" onClick={onDelete} title="Delete match" aria-label="Delete match"><Trash2 size={15}/></button>}
      </div>
    </article>
  );
}

export default function MessiApp() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [progress, setProgress] = useState<Progress>(() => typeof window === "undefined" ? emptyProgress : readLocal());
  const [ready, setReady] = useState(!firebaseEnabled);
  const [view, setView] = useState<View>("matches");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [openYears, setOpenYears] = useState<number[]>([2022, 2009]);
  const [toast, setToast] = useState("");
  const [remoteMatches, setRemoteMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [quizWrong, setQuizWrong] = useState<number | null>(null);
  const [matchFormOpen, setMatchFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const firebase = getFirebase();

  const matches = useMemo(() => {
    const merged = new Map(seedMatches.map((m) => [m.id, m]));
    remoteMatches.forEach((m) => merged.set(m.id, m));
    return [...merged.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [remoteMatches]);

  useEffect(() => {
    if (!firebase) {
      return;
    }
    const unsubscribe = onAuthStateChanged(firebase.auth, async (authUser) => {
      setReady(false);
      if (!authUser) {
        setUser(null);
        setProgress(readLocal());
        setRemoteMatches([]);
        setReady(true);
        return;
      }
      await hydrateUser(authUser, firebase.db);
    });
    return () => unsubscribe();
    // Firebase clients are module-scoped once initialized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!firebase || !user) return;
    return onSnapshot(collection(firebase.db, "matches"), (snapshot) => {
      setRemoteMatches(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Match));
    }, () => notify("Couldn't load the shared match archive."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (!firebase || !user || view !== "community" || !progress.quizPassed) return;
    const chatQuery = query(collection(firebase.db, "chatMessages"), orderBy("createdAt", "asc"));
    return onSnapshot(chatQuery, (snapshot) => {
      setMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChatMessage));
    }, () => notify("The fan room could not connect."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, view, progress.quizPassed]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(`${localKey}:${user?.uid || "preview"}`, JSON.stringify(progress));
    if (firebase && user) {
      setDoc(doc(firebase.db, "users", user.uid), {
        name: user.name, watched: progress.watched, saved: progress.saved,
        quizPassed: progress.quizPassed, updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => notify("Cloud save failed. Check the Firestore rules."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, ready, user?.uid]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function hydrateUser(authUser: FirebaseUser, db: NonNullable<ReturnType<typeof getFirebase>>["db"]) {
    const token = await authUser.getIdTokenResult(true);
    const role = token.claims.admin === true ? "admin" : "user";
    const name = authUser.displayName || authUser.email || "Messi fan";
    try {
      const { getDoc } = await import("firebase/firestore");
      const saved = await getDoc(doc(db, "users", authUser.uid));
      const remote = saved.exists() ? saved.data() : {};
      setUser({ uid: authUser.uid, name, email: authUser.email || undefined, photo: authUser.photoURL || undefined, role });
      setProgress({
        watched: Array.isArray(remote.watched) ? remote.watched : readLocal(authUser.uid).watched,
        saved: Array.isArray(remote.saved) ? remote.saved : readLocal(authUser.uid).saved,
        quizPassed: remote.quizPassed === true,
      });
      await setDoc(doc(db, "users", authUser.uid), { name, updatedAt: serverTimestamp() }, { merge: true });
    } catch {
      setUser({ uid: authUser.uid, name, email: authUser.email || undefined, photo: authUser.photoURL || undefined, role });
      setProgress(readLocal(authUser.uid));
      notify("Signed in, but the profile could not sync. Check Firebase setup.");
    } finally {
      setReady(true);
    }
  }

  async function googleSignIn() {
    if (!firebase) { setUser({ uid: "preview", name: "Messi fan", role: "user" }); setProgress(readLocal()); setReady(true); return; }
    setBusy(true);
    try { await signInWithPopup(firebase.auth, firebase.googleProvider); }
    catch { notify("Google sign-in didn't finish. Check the Firebase auth settings."); }
    finally { setBusy(false); }
  }

  async function logout() {
    if (firebase) await signOut(firebase.auth);
    setUser(null); setProgress(readLocal()); setView("matches");
  }

  function toggleProgress(field: "watched" | "saved", id: string) {
    setProgress((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((value) => value !== id) : [...current[field], id] }));
  }

  function enterPreview() {
    setUser({ uid: "preview", name: "Messi fan", role: "user" });
    setProgress(readLocal()); setReady(true);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = String(data.get("message") || "").trim();
    if (!text || !user) return;
    if (firebase && user.uid !== "preview") {
      try {
        await addDoc(collection(firebase.db, "chatMessages"), {
          uid: user.uid, name: user.name, text,
          time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
          createdAt: serverTimestamp(),
        });
      } catch { notify("Message couldn't send. Check your Firestore rules."); }
    } else {
      const item: ChatMessage = { id: crypto.randomUUID(), uid: user.uid, name: user.name, text, time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) };
      setMessages((current) => [...current, item]);
    }
    form.reset();
  }

  async function addMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firebase || user?.role !== "admin") { notify("Admin match management needs Firebase admin access."); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    const date = String(data.get("date"));
    const item: Match = {
      id: `admin-${date}-${crypto.randomUUID().slice(0, 6)}`, date,
      year: Number(date.slice(0, 4)), type: data.get("type") as Match["type"],
      team: String(data.get("team")), opponent: String(data.get("opponent")),
      competition: String(data.get("competition")), stage: String(data.get("stage")),
      score: String(data.get("score")), url: String(data.get("url")),
    };
    try {
      await setDoc(doc(firebase.db, "matches", item.id), item);
      form.reset(); setMatchFormOpen(false); notify("Match added to the shared archive.");
    } catch { notify("Match could not be saved. Check that your account has admin access."); }
  }

  async function deleteMatch(match: Match) {
    if (!firebase || user?.role !== "admin") return;
    try { await deleteDoc(doc(firebase.db, "matches", match.id)); notify("Match removed from the shared archive."); }
    catch { notify("Match could not be removed."); }
  }

  const filtered = useMemo(() => matches
    .filter((match) => filter === "All" || match.type === filter)
    .filter((match) => !search || `${match.year} ${match.team} ${match.opponent} ${match.competition} ${match.stage}`.toLowerCase().includes(search.toLowerCase())), [matches, filter, search]);
  const years = [...new Set(filtered.map((match) => match.year))].sort((a, b) => b - a);
  const watchedCount = progress.watched.length;
  const percent = Math.round((watchedCount / Math.max(matches.length, 1)) * 100);
  const title = { matches: "MATCHES", watchlist: "MY WATCHLIST", community: "FAN ROOM", admin: "ADMIN" }[view];

  if (!user) return (
    <main className="login-screen">
      <div className="login-photo" aria-hidden="true"/><div className="login-shade"/>
      <div className="login-brand"><span className="ball-mark">✦</span> MESSI <span className="brand-light">/ THE ARCHIVE</span></div>
      <div className="login-copy">
        <div className="eyebrow"><span className="live-dot"/> THE DEFINITIVE FAN ARCHIVE</div>
        <h1>Every match.<br/><em>Every moment.</em></h1>
        <p>A lifetime of football, one watchlist. Find the matches, make the memories, keep your own record.</p>
        <div className="login-actions">
          <button className="google-button" onClick={googleSignIn} disabled={busy}><span className="google-g">G</span>{busy ? "Connecting…" : "Continue with Google"}<ArrowUpRight className="arrow" size={15}/></button>
          <button className="preview-button" onClick={enterPreview}>Explore the archive <span>→</span></button>
        </div>
        {!firebaseEnabled && <div className="login-note">Preview is ready. Add Firebase credentials to enable Google sign-in and cloud sync.</div>}
        {firebaseEnabled && <div className="login-note">Sign in to sync your watch history across devices.</div>}
      </div>
      <div className="photo-credit">Photo: Fanny Schertzer / Flickr · CC BY 3.0</div>
      <div className="login-footer">A FAN PROJECT <span>·</span> MADE FOR THE LOVE OF THE GAME</div>
    </main>
  );

  const watchMatches = matches.filter((match) => progress.saved.includes(match.id));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "nav-open" : ""}`}>
        <a className="brand" href="#archive" onClick={(e) => {e.preventDefault(); setView("matches");}}><span className="ball-mark">✦</span><span>MESSI<small>THE ARCHIVE</small></span></a>
        <div className="side-label">YOUR SPACE</div>
        <button className={`nav-item ${view === "matches" ? "active" : ""}`} onClick={() => {setView("matches");setMobileNav(false)}}><LayoutGrid size={16}/> Match archive <span className="nav-count">{matches.length}</span></button>
        <button className={`nav-item ${view === "watchlist" ? "active" : ""}`} onClick={() => {setView("watchlist");setMobileNav(false)}}><Clock3 size={16}/> My watchlist <span className="nav-count">{progress.saved.length}</span></button>
        <button className={`nav-item ${view === "community" ? "active" : ""}`} onClick={() => {setView("community");setMobileNav(false)}}><MessageCircle size={16}/> Fan room {!progress.quizPassed && <LockKeyhole className="nav-lock" size={13}/>}</button>
        {user.role === "admin" && <><div className="side-label side-label-admin">MANAGEMENT</div><button className={`nav-item ${view === "admin" ? "active" : ""}`} onClick={() => {setView("admin");setMobileNav(false)}}><Shield size={16}/> Manage matches <span className="nav-lock">ADMIN</span></button></>}
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><Sparkles size={15}/><div><b>One match at a time.</b><small>Your journey is just getting started.</small></div></div>
          <div className="profile"><div className="avatar" aria-label={`${user.name} profile`} style={user.photo ? { backgroundImage: `url("${user.photo}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!user.photo && user.name[0]?.toUpperCase()}</div><div className="profile-copy"><b>{user.name}</b><small>{user.role === "admin" ? "ARCHIVE ADMIN" : "MESSI FAN"}</small></div><button className="signout" title="Sign out" onClick={logout}><LogOut size={15}/></button></div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="crumb">THE ARCHIVE <span>/</span> <b>{title}</b></div><div className="top-right"><span className="saved-indicator"><i/> {ready ? "Progress saved" : "Syncing…"}</span><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu"><Menu size={18}/></button></div></header>

        {view === "matches" && <div className="page">
          <section className="hero-card"><div className="hero-bg"/><div className="hero-content"><div className="eyebrow">THE LONG WAY HOME <span>· 2004 — NOW</span></div><h2>A career written<br/>in <em>moments.</em></h2><p>From the first steps in Barcelona to the world champion&apos;s crown. Your journey through every era starts here.</p><button className="hero-cta" onClick={() => document.getElementById("archiveSection")?.scrollIntoView({behavior:"smooth"})}>Explore the matches <ArrowDown size={13}/></button></div><div className="hero-number">10</div><div className="hero-stats"><div><b>20<span>+</span></b><small>SEASONS</small></div><i/><div><b>6</b><small>CHAPTERS</small></div><i/><div><b>{watchedCount}</b><small>WATCHED BY YOU</small></div></div></section>
          <section className="archive-section" id="archiveSection">
            <div className="section-head"><div><div className="eyebrow">PICK UP WHEREVER YOU LIKE</div><h2>The match archive</h2><p>Every era has a story. Find yours.</p></div><span className="filter-button"><Filter size={14}/><span>{matches.length} matches</span></span></div>
            <div className="toolbar"><label className="search-wrap"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} type="search" placeholder="Search a club, tournament, year…"/></label><div className="filter-pills">{["All", "Club", "International"].map((kind) => <button key={kind} className={`pill ${filter === kind ? "active" : ""}`} onClick={() => setFilter(kind)}>{kind === "All" ? "All matches" : kind}</button>)}</div></div>
            <div className="archive-list">{years.map((year) => {
              const rows = filtered.filter((match) => match.year === year);
              const isOpen = openYears.includes(year) || !!search || filter !== "All";
              const types = [...new Set(rows.map((match) => match.type))];
              return <section className="year-block" key={year}><button className="year-heading year-toggle" onClick={() => setOpenYears((prev) => prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year])}><b>{year}</b><span>{rows.length} {rows.length === 1 ? "MATCH" : "MATCHES"}</span><i/><ChevronDown className={isOpen ? "turned" : ""} size={15}/></button>{isOpen && <div className="year-body">{types.map((type) => {
                const items = rows.filter((match) => match.type === type);
                return <div key={type} className="type-group"><div className={`type-heading ${type === "International" ? "gold" : ""}`}>{type === "International" ? <Globe2 size={12}/> : <Trophy size={12}/>} {type.toUpperCase()}<i/></div>{[...new Set(items.map((m) => m.competition))].map((competition) => <div key={competition}><div className="competition-heading">{competition}<i/></div>{items.filter((m) => m.competition === competition).map((match) => <MatchRow key={match.id} match={match} watched={progress.watched.includes(match.id)} saved={progress.saved.includes(match.id)} onWatched={() => toggleProgress("watched", match.id)} onSaved={() => toggleProgress("saved", match.id)}/>)}</div>)}
                </div>;
              })}</div>}</section>;
            })}{years.length === 0 && <div className="empty-state"><Search size={28}/><b>No matches found</b><p>Try a different search or filter.</p></div>}</div>
          </section>
        </div>}

        {view === "watchlist" && <div className="page"><div className="simple-page-head"><div className="eyebrow">YOUR PERSONAL JOURNEY</div><h1>My watchlist</h1><p>Every match you save, all in one place.</p></div><div className="progress-card"><div className="progress-ring">{percent}%</div><div className="progress-copy"><b>{watchedCount} of {matches.length} archive matches watched</b><p>Your journey through the archive is underway. Keep going.</p><div className="progress-track"><i style={{width:`${percent}%`}}/></div></div></div><div className="list-card">{watchMatches.length ? watchMatches.map((match) => <MatchRow key={match.id} match={match} watched={progress.watched.includes(match.id)} saved={progress.saved.includes(match.id)} onWatched={() => toggleProgress("watched", match.id)} onSaved={() => toggleProgress("saved", match.id)}/>) : <div className="empty-state"><Clock3 size={28}/><b>Your watchlist is waiting</b><p>Save matches from the archive to build your next watch session.</p><button onClick={() => setView("matches")}>Explore the archive <ArrowUpRight size={13}/></button></div>}</div></div>}

        {view === "community" && <div className="page"><div className="simple-page-head"><div className="eyebrow">ONE CLUB. ONE COMMUNITY.</div><h1>The fan room</h1><p>Prove you&apos;re one of us, then join the conversation.</p></div>{!progress.quizPassed ? <div className="community-card"><div className="quiz-head"><div className="quiz-icon"><CircleHelp size={20}/></div><div><b>Quick fan check</b><p>One question stands between you and the fan room.</p></div></div><div className="quiz-question">{quiz.question}</div><div className="quiz-options">{quiz.answers.map((answer,index) => <button key={answer} className={`quiz-option ${quizWrong === index ? "incorrect" : ""}`} onClick={() => {if(index === quiz.correct){setProgress((p) => ({...p,quizPassed:true}));setQuizWrong(null);notify("That’s right. Welcome to the fan room.")}else{setQuizWrong(index);window.setTimeout(() => setQuizWrong(null),700)}}}>{answer}</button>)}</div><div className="chat-locked">A little Messi knowledge keeps the conversation <b>for the fans.</b></div></div> : <div className="community-card"><div className="chat-top"><i className="online-dot"/> Messi fans <span>{firebase && user.uid !== "preview" ? "Live community chat" : "Preview chat · saved on this device"}</span></div><div className="chat-box"><div className="chat-messages">{messages.length ? messages.map((message) => <div className="chat-message" key={message.id}><b>{message.name}</b><small>{message.time}</small><br/>{message.text}</div>) : <div className="chat-locked">You&apos;re in. Kick off the conversation: what&apos;s the first Messi match you remember watching?</div>}<div ref={chatEnd}/></div><form className="chat-input" onSubmit={sendMessage}><input name="message" maxLength={240} placeholder="Share a match memory…" required/><button aria-label="Send message"><Send size={15}/></button></form></div></div>}</div>}

        {view === "admin" && user.role === "admin" && <div className="page"><div className="simple-page-head"><div className="eyebrow">ARCHIVE MANAGEMENT</div><h1>Manage matches</h1><p>Add to or curate the shared match archive. Admin access is verified by Firebase.</p></div><div className="admin-toolbar"><div><Shield size={16}/><b>Admin controls</b><span>{remoteMatches.length} added matches</span></div><button className="admin-add" onClick={() => setMatchFormOpen(!matchFormOpen)}>{matchFormOpen ? <X size={15}/> : <Plus size={15}/>} {matchFormOpen ? "Cancel" : "Add a match"}</button></div>{matchFormOpen && <form className="match-form" onSubmit={addMatch}><label>Match date<input type="date" name="date" required/></label><label>Team<input name="team" placeholder="Barcelona" required/></label><label>Opponent<input name="opponent" placeholder="Real Madrid" required/></label><label>Competition<input name="competition" placeholder="La Liga" required/></label><label>Stage<input name="stage" placeholder="Matchday 34" required/></label><label>Score<input name="score" placeholder="2–6" required/></label><label>Match type<select name="type"><option>Club</option><option>International</option></select></label><label className="wide">Footballia link<input name="url" type="url" placeholder="https://footballia.net/matches/…" required/></label><button className="admin-add submit-match" type="submit"><Plus size={14}/> Publish match</button></form>}<div className="list-card admin-list">{remoteMatches.length ? remoteMatches.map((match) => <MatchRow key={match.id} match={match} watched={progress.watched.includes(match.id)} saved={progress.saved.includes(match.id)} onWatched={() => toggleProgress("watched", match.id)} onSaved={() => toggleProgress("saved", match.id)} canDelete onDelete={() => deleteMatch(match)}/>) : <div className="empty-state"><CalendarDays size={27}/><b>No custom matches yet</b><p>Use the admin form to add matches to the shared archive.</p></div>}</div></div>}
      </main>
      {toast && <div className="toast"><Check size={14}/>{toast}</div>}
      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
    </div>
  );
}
