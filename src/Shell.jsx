import { useEffect, useState } from "react";
import { api, login, logout, useLive } from "./api";
import { Icon, Logo, initials, Toasts } from "./lib";

const LABEL = { broker: "for Brokers", developer: "for Developers", owner: "Owner console" };
const SWITCH = {
  broker: [["#/developer", "Developer site"]],
  developer: [["#/broker", "Broker site"]],
  owner: [
    ["#/broker", "Broker site"],
    ["#/developer", "Developer site"],
  ],
};
export const APP_URL = import.meta.env.VITE_APP_URL || "";

/** Restores a portal session from its cookie, or shows that portal's sign-in. */
export function useSession(kind) {
  const [me, setMe] = useState(undefined);
  const load = () =>
    api(kind, `/${kind}/me`)
      .then(setMe)
      .catch(() => setMe(null));
  useEffect(() => {
    setMe(undefined);
    load();
    const out = (e) => e.detail === kind && setMe(null);
    window.addEventListener("ks:signed-out", out);
    return () => window.removeEventListener("ks:signed-out", out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  useLive(kind, !!me);
  return {
    me,
    reload: load,
    signIn: async (id, pw) => {
      await login(kind, id, pw);
      await load();
    },
    signOut: async () => {
      await logout(kind);
      setMe(null);
    },
  };
}

export function WebShell({ kind, nav, page, go, user, crumb, right, children, onSignOut }) {
  useEffect(() => {
    document.getElementById("wmain")?.scrollTo(0, 0);
  }, [page]);
  return (
    <div className="web">
      <aside className="side">
        <div className="side-brand">
          <Logo s={34} light />
          <div>
            <b>Keystone</b>
            <small>{LABEL[kind]}</small>
          </div>
        </div>
        <nav className="snav" aria-label="Sections">
          {nav.map((n) => (
            <button key={n.id} className={"snav-i" + (page === n.id ? " on" : "")} aria-current={page === n.id ? "page" : undefined} onClick={() => go(n.id)}>
              <Icon n={n.icon} s={19} />
              <span>{n.label}</span>
              {n.badge ? <i className="nb">{n.badge}</i> : null}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <span className="av-sq">{user.photo ? <img src={user.photo} alt="" /> : initials(user.name)}</span>
            <div style={{ minWidth: 0 }}>
              <b>{user.name}</b>
              <small>{user.line}</small>
            </div>
          </div>
          <button className="gbtn" style={{ justifySelf: "start", marginLeft: 8 }} onClick={onSignOut}>
            <Icon n="logout" s={14} /> Sign out
          </button>
          <div className="side-switch">
            <span className="sl">Switch view</span>
            {SWITCH[kind].map(([href, l]) => (
              <a key={href} href={href}>
                {l}
              </a>
            ))}
            <a href="#/">All three</a>
          </div>
        </div>
      </aside>
      <main className="wmain" id="wmain">
        <header className="wtop">
          <div className="crumb">{crumb}</div>
          {right}
          {kind !== "owner" ? (
            <span className="livepill" title="Changes from agents and other tabs appear here as they happen">
              <i />
              Live
            </span>
          ) : null}
        </header>
        <div className="wpage">{children}</div>
      </main>
      <Toasts />
    </div>
  );
}

export function WebLogin({ kind, title, lede, onSignIn, idLabel = "User ID", forgot }) {
  const [id, setId] = useState(""),
    [pw, setPw] = useState(""),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!id.trim() || !pw) return setErr(`Enter your ${idLabel.toLowerCase()} and password.`);
    setBusy(true);
    setErr("");
    try {
      await onSignIn(id.trim(), pw);
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };
  return (
    <div className="wlogin">
      <div className="wl-art">
        <svg className="arches" viewBox="0 0 560 560" fill="none" aria-hidden="true">
          <path d="M60 560V280a220 220 0 0 1 440 0v280" stroke="#B08D57" strokeOpacity=".22" />
          <path d="M120 560V284a160 160 0 0 1 320 0v276" stroke="#B08D57" strokeOpacity=".15" />
          <path d="M180 560V288a100 100 0 0 1 200 0v272" stroke="#B08D57" strokeOpacity=".1" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <Logo s={40} light />
          <b style={{ fontFamily: "var(--f-display)", fontWeight: 400, fontSize: 26, letterSpacing: ".06em" }}>Keystone</b>
          <span className="gtag" style={{ margin: "0 0 0 6px", color: "var(--gold-2)", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>
            {LABEL[kind]}
          </span>
        </div>
        <div>
          <h1>{title}</h1>
          <p>{lede}</p>
        </div>
        <p style={{ fontSize: 13, margin: 0 }}>
          Switch view:{" "}
          {SWITCH[kind].map(([href, l]) => (
            <span key={href}>
              <a href={href} style={{ color: "var(--gold-2)" }}>
                {l}
              </a>{" "}
              ·{" "}
            </span>
          ))}
          <a href="#/" style={{ color: "var(--gold-2)" }}>
            All three
          </a>
        </p>
      </div>
      <div className="wl-form">
        <form onSubmit={submit}>
          <div>
            <p className="eyebrow">{kind === "broker" ? "Broker sign in" : kind === "developer" ? "Developer sign in" : "Keystone owner"}</p>
            <h2>Welcome back</h2>
          </div>
          <div className="field">
            <label htmlFor={kind + "-id"}>{idLabel}</label>
            <div className="inp">
              <Icon n="user" s={18} />
              <input id={kind + "-id"} value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoCapitalize="none" />
            </div>
          </div>
          <div className="field">
            <label htmlFor={kind + "-pw"}>Password</label>
            <div className="inp">
              <Icon n="key" s={18} />
              <input id={kind + "-pw"} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
            </div>
          </div>
          {err ? <p className="err">{err}</p> : null}
          <button className="btn block" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {forgot ? <p className="hint" style={{ margin: 0 }}>{forgot}</p> : null}
        </form>
      </div>
    </div>
  );
}

export function Boot() {
  return (
    <div className="wlogin" style={{ display: "grid", placeItems: "center", background: "var(--navy)" }}>
      <Logo s={56} light />
    </div>
  );
}
