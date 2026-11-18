// Shared building blocks for the Keystone portals (ported from the Keystone prototype).
import { useEffect, useState } from "react";

/* ---------- Rules shared with the backend ---------- */
export const BUCKETS = [
  { id: "fresh", label: "Fresh", c: "#4A6FA5" },
  { id: "rechurn", label: "Rechurn", c: "#B57F22" },
  { id: "followup", label: "Follow-up", c: "#2F7F86" },
  { id: "interested", label: "Interested", c: "#7A63A8" },
  { id: "vp", label: "Visit proposed", c: "#A07C45", short: "VP" },
  { id: "vc", label: "Visit confirmed", c: "#2E7A57", short: "VC" },
  { id: "walkin", label: "Walk-in", c: "#8E5B36" },
  { id: "junk", label: "Junk", c: "#7F8898" },
  { id: "failed", label: "Failed", c: "#A3413A" },
];
export const B = (id) => BUCKETS.find((b) => b.id === id) || { id, label: id, c: "#7F8898" };
export const OUTCOME = {
  connected: "Connected",
  no_answer: "Ringing, no answer",
  disconnected: "Rang, then disconnected",
  waiting: "Call waiting",
  not_reachable: "Not reachable",
  switched_off: "Switched off",
  incorrect: "Incorrect number",
  oos: "Out of service",
  invalid: "Invalid number",
  no_through: "Call didn’t go through",
  cancelled: "Cancelled",
};
export const PLAN_PERF = { none: "No", basic: "Basic", advanced: "Advanced" };

/* ---------- Formatting (India) ---------- */
export const num = (n) => Number(n || 0).toLocaleString("en-IN");
export const inr = (n) => {
  const v = Number(n || 0),
    d = v % 1 ? 2 : 0;
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
};
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const initials = (n) =>
  String(n || "?")
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const firstName = (n) => String(n || "").split(" ")[0];
export function fmtTalk(s) {
  s = Math.round(s || 0);
  if (s < 60) return s + "s";
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return h ? h + "h " + m + "m" : m + "m";
}
export const fmtDur = (s) => {
  s = Math.round(s || 0);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};
const TZ = { timeZone: "Asia/Kolkata" };
export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { ...TZ, hour: "numeric", minute: "2-digit" }).replace(/\s?([ap])m/i, (x, a) => " " + a.toUpperCase() + "M");
export const fmtDate = (d, year) =>
  new Date(d).toLocaleDateString("en-IN", { ...TZ, day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
export const fmtLong = (d) => new Date(d).toLocaleDateString("en-IN", { ...TZ, weekday: "long", day: "numeric", month: "long" });
const istDay = (d) => new Date(new Date(d).getTime() + 330 * 60000).toISOString().slice(0, 10);
export const dayDiff = (d) => (Date.parse(istDay(d)) - Date.parse(istDay(Date.now()))) / 86400000;
export function fmtWhen(d) {
  const k = dayDiff(d);
  const day = k === 0 ? "Today" : k === 1 ? "Tomorrow" : k === -1 ? "Yesterday" : fmtDate(d);
  return day + ", " + fmtTime(d);
}
export function ago(d) {
  if (!d) return "—";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  if (s < 7 * 86400) return Math.floor(s / 86400) + " d ago";
  return fmtDate(d);
}
export const greetWord = () => {
  const h = Number(new Date().toLocaleString("en-IN", { ...TZ, hour: "numeric", hour12: false }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
export function ageFrom(dob) {
  if (!dob) return "";
  const d = new Date(dob),
    n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return isNaN(a) ? "" : a;
}

/* ---------- Icons ---------- */
const IP = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  building: "M4 21V9l8-6 8 6v12M3 21h18M9 21v-5h6v5M9 11h.01M15 11h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  move: "M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  check: "M20 6 9 17l-5-5",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  calendar: "M4 5h16v16H4zM16 3v4M8 3v4M4 10h16",
  calCheck: "M4 5h16v16H4zM16 3v4M8 3v4M4 10h16M9 15.5l2 2 4-4",
  x: "M18 6 6 18M6 6l12 12",
  spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z",
  door: "M3 21h18M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M14 12h.01",
  repeat: "M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8",
  note: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  chat: "M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  key: "M14.5 9.5a4.5 4.5 0 1 0-1.9 3.7L20 20.6V17h-2.5v-2.5H15l-1.6-1.6a4.5 4.5 0 0 0 1.1-3.4zM8.5 8.5h.01",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  transfer: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  upload: "M12 15V3M7 8l5-5 5 5M5 21h14",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  pin: "M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
  forward: "M5 12h14M13 6l6 6-6 6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  briefcase: "M4 8h16v12H4zM9 8V5h6v3M4 13h16",
  plus: "M12 5v14M5 12h14",
  chart: "M5 20V11M11 20V5M17 20v-8M3 20h18",
  cards: "M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM2 7v10M22 7v10",
  megaphone: "M3 10v4h4l9 5V5L7 10zM19 9v6M7 14l1.5 5h3L10 15",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  heart: "M12 20s-8-4.6-8-10.2A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.8C20 15.4 12 20 12 20z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  external: "M14 4h6v6M10 14 20 4M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
  crown: "M3 8l4 4 5-7 5 7 4-4-2 11H5z",
  file: "M6 3h9l4 4v14H6zM14 3v5h5",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  smartphone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  undo: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  rupee: "M6 4h12M6 9h12M14.5 20 7 13h2a4.5 4.5 0 0 0 0-9",
};
export function Icon({ n, s = 20, w, cls }) {
  return (
    <svg className={"ic " + (cls || "")} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w || 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={IP[n] || IP.info} />
    </svg>
  );
}
export function Logo({ s = 28, light }) {
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M9 44V26a15 15 0 0 1 30 0v18" fill="none" stroke={light ? "#F7F4ED" : "#0E1A2B"} strokeWidth="3.2" />
      <path d="M19.4 4.2h9.2l-2.1 11h-5z" fill="#B08D57" stroke={light ? "#0E1A2B" : "#F7F4ED"} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Project artwork (drawn, no photos), seeded from the project ---------- */
const SKIES = [
  ["#0F1D33", "#2C4266", "#C9A46B"],
  ["#1A2B47", "#4A6280", "#E3C08A"],
  ["#0B1526", "#1E3352", "#8394AC"],
  ["#22324D", "#6F7F95", "#E9CFA2"],
];
const SEA = /worli|juhu|malabar|wadala|bandra|marine|colaba|versova|mahim/i;
const artCache = {};
function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function artSVG(key, locality) {
  const ck = key + "|" + locality;
  if (artCache[ck]) return artCache[ck];
  const seed = hash(key),
    r = rng(seed),
    sk = SKIES[seed % 4],
    sea = SEA.test(locality || ""),
    hero = 1 + (seed % 3);
  const W = 400,
    H = 260,
    hz = sea ? 182 : 196,
    id = "a" + seed.toString(36);
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk[0]}"/><stop offset=".64" stop-color="${sk[1]}"/><stop offset="1" stop-color="${sk[2]}"/></linearGradient><linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0B1524"/><stop offset=".7" stop-color="#1A2D4A"/><stop offset="1" stop-color="#22385A"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}g)"/>`;
  s += `<circle cx="${(70 + r() * 260).toFixed(0)}" cy="${(hz - 40 - r() * 34).toFixed(0)}" r="${(13 + r() * 9).toFixed(0)}" fill="#F3E3C3" opacity=".5"/>`;
  let x = -10,
    d = "";
  while (x < W) {
    const w = 10 + r() * 24,
      h = 16 + r() * 50;
    d += `M${x.toFixed(1)} ${hz}V${(hz - h).toFixed(1)}h${w.toFixed(1)}V${hz}z`;
    x += w + 2 + r() * 7;
  }
  s += `<path d="${d}" fill="#3A4E6E" opacity=".55"/>`;
  const tw = hero > 2 ? 40 : 50,
    gap = 16,
    total = hero * tw + (hero - 1) * gap,
    x0 = W / 2 - total / 2 + (r() * 40 - 20);
  for (let i = 0; i < hero; i++) {
    const th = (hero > 2 ? 104 : 128) + r() * 40 - (i % 2) * 22,
      tx = x0 + i * (tw + gap),
      ty = hz - th;
    s += `<path d="M${tx.toFixed(1)} ${ty.toFixed(1)}h${tw}l-${(tw * 0.16).toFixed(1)} -9h-${(tw * 0.68).toFixed(1)}z" fill="#0B1524"/>`;
    s += `<rect x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" width="${tw}" height="${th.toFixed(1)}" fill="url(#${id}t)"/>`;
    let fl = "";
    for (let y = ty + 8; y < hz - 3; y += 6) fl += `M${(tx + 4).toFixed(1)} ${y.toFixed(1)}h${tw - 8}`;
    s += `<path d="${fl}" stroke="#D3B57C" stroke-width=".6" opacity=".38"/>`;
    s += `<rect x="${(tx + tw * 0.58).toFixed(1)}" y="${(ty + 12).toFixed(1)}" width="${(tw * 0.24).toFixed(1)}" height="${(th * 0.55).toFixed(1)}" fill="#E6CB94" opacity=".1"/>`;
  }
  if (sea) {
    s += `<rect y="${hz}" width="${W}" height="${H - hz}" fill="#111F35"/>`;
    let w2 = "";
    for (let k = 0; k < 16; k++) {
      const y = hz + 6 + k * 4.6 + r() * 2,
        xs = r() * W,
        len = 18 + r() * 90;
      w2 += `M${xs.toFixed(1)} ${y.toFixed(1)}h${len.toFixed(1)}`;
    }
    s += `<path d="${w2}" stroke="#D9BC86" stroke-width="1" opacity=".32" stroke-linecap="round"/>`;
  } else {
    s += `<rect y="${hz}" width="${W}" height="${H - hz}" fill="#15253B"/>`;
    for (let k = 0; k < 30; k++) s += `<circle cx="${(r() * W).toFixed(1)}" cy="${(hz + 1 + r() * 8).toFixed(1)}" r="${(5 + r() * 8).toFixed(1)}" fill="#1C3636" opacity=".95"/>`;
  }
  return (artCache[ck] = s + "</svg>");
}
export const Art = ({ id, name, locality, cls }) => (
  <div className={"art " + (cls || "")} dangerouslySetInnerHTML={{ __html: artSVG(id || name || "project", locality) }} />
);

/* ---------- Small components ---------- */
export const Pill = ({ b, text }) => (
  <span className="pill" style={{ "--c": B(b).c }}>
    {text || B(b).label}
  </span>
);
export const AvA = ({ name, size, dark }) => (
  <span className="av" style={{ "--c": dark ? "#0E1A2B" : "#24395A", ...(size ? { width: size, height: size } : {}) }} title={name}>
    {initials(name)}
  </span>
);
export function BarIn({ v, max, label, tone }) {
  const w = max ? Math.min(100, (v / max) * 100) : 0;
  return (
    <div className="bar-in">
      <div className="track">
        <i className={tone || ""} style={{ width: w + "%" }} />
      </div>
      <span>{label != null ? label : v}</span>
    </div>
  );
}
export function Seg({ opts, val, set }) {
  return (
    <div className="seg" role="tablist">
      {opts.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={val === k} className={val === k ? "on" : ""} onClick={() => set(k)}>
          {l}
        </button>
      ))}
    </div>
  );
}
export function Funnel({ f }) {
  if (!f) return null;
  const rows = [
    ["Leads assigned", f.assigned],
    ["Dialled", f.dialled],
    ["Connected", f.connected],
    ["Interested or further", f.interested],
    ["Visit proposed or further", f.vp],
    ["Visit confirmed or further", f.vc],
    ["Walked in", f.walkin],
  ];
  const max = Math.max(1, f.assigned);
  return (
    <div className="funnel" role="table" aria-label="Lead funnel">
      {rows.map(([label, v], i) => (
        <div className="fr" role="row" key={label} title={`${label}: ${v} (${pct(v, max)}% of assigned)`}>
          <span className="fl" role="cell">{label}</span>
          <span className="ft" role="cell">
            <i className={i === rows.length - 1 ? "last" : ""} style={{ width: Math.max(0.5, (v / max) * 100) + "%" }} />
          </span>
          <span className="fv" role="cell">
            {num(v)}
            <small>{i ? pct(v, max) + "%" : ""}</small>
          </span>
        </div>
      ))}
    </div>
  );
}
const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Seven-day bars. Labels on the latest day and the peak; every bar has a tooltip. */
export function DayBars({ days, field, label }) {
  if (!days?.length) return null;
  const vals = days.map((d) => d[field] || 0),
    mx = Math.max(1, ...vals),
    W2 = 420,
    H2 = 150,
    pad = 22,
    bw = (W2 - 8) / 7;
  const peak = vals.indexOf(Math.max(...vals));
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W2} ${H2 + 24}`} role="img" aria-label={label + " per day, last 7 days"}>
        <line x1="0" x2={W2} y1={H2} y2={H2} stroke="#E5DFD2" />
        {days.map((d, i) => {
          const v = vals[i],
            h = v ? Math.max(4, (v / mx) * (H2 - pad)) : 0,
            x = 4 + i * bw + 8,
            w = bw - 16;
          return (
            <g key={d.day}>
              <title>{`${fmtDate(d.day + "T06:00:00Z")}: ${v} ${label.toLowerCase()}`}</title>
              <rect x={x - 6} y="0" width={w + 12} height={H2} fill="transparent" />
              {h ? <path d={`M${x} ${H2}V${H2 - h + 4}q0-4 4-4h${w - 8}q4 0 4 4V${H2}z`} fill={i === 6 ? "#B08D57" : "#24395A"} /> : null}
              {(i === 6 || i === peak) && v ? (
                <text x={x + w / 2} y={H2 - h - 6} textAnchor="middle" fontSize="12" fill="#141B27" fontFamily="Albert Sans, sans-serif" fontWeight="600">
                  {v}
                </text>
              ) : null}
              <text x={x + w / 2} y={H2 + 16} textAnchor="middle" fontSize="11" fill="#7E8796" fontFamily="Albert Sans, sans-serif">
                {i === 6 ? "Today" : DOWS[new Date(d.day + "T06:00:00Z").getUTCDay()]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
/** Calls per hour, 9 AM to 9 PM; the current hour is navy. */
export function Hours({ h }) {
  const hrs = [];
  for (let i = 9; i <= 21; i++) hrs.push(i);
  const mx = Math.max(1, ...hrs.map((i) => h[i] || 0)),
    cur = Number(new Date().toLocaleString("en-IN", { ...TZ, hour: "numeric", hour12: false })),
    W = 300,
    Hh = 64,
    bw = W / hrs.length;
  return (
    <div className="hours">
      <svg viewBox={`0 0 ${W} ${Hh + 18}`} role="img" aria-label="Calls per hour today">
        <line x1="0" x2={W} y1={Hh} y2={Hh} stroke="#E5DFD2" />
        {hrs.map((i, k) => {
          const v = h[i] || 0,
            bh = v ? Math.max(3, (v / mx) * (Hh - 6)) : 0;
          return (
            <g key={i}>
              <title>{`${i}:00 · ${v} calls`}</title>
              {bh ? <rect x={k * bw + 4} y={Hh - bh} width={bw - 8} height={bh} rx="2" fill={i === cur ? "#0E1A2B" : "#B08D57"} /> : null}
              {i % 3 === 0 ? (
                <text x={k * bw + bw / 2} y={Hh + 14} textAnchor="middle" fontSize="9.5" fill="#7E8796" fontFamily="Albert Sans, sans-serif">
                  {i > 12 ? i - 12 + "p" : i === 12 ? "12p" : i + "a"}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function Locked2({ title, text, cta, onCta, icon = "lock" }) {
  return (
    <div className="panel">
      <div className="lock">
        <span className="li">
          <Icon n={icon} s={24} />
        </span>
        <h2>{title}</h2>
        <p>{text}</p>
        {cta ? (
          <button className="btn md gold" onClick={onCta}>
            {cta}
          </button>
        ) : null}
      </div>
    </div>
  );
}
export function Loading({ text = "Loading…" }) {
  return <p className="empty-w">{text}</p>;
}
export function ErrorNote({ error, retry }) {
  if (!error) return null;
  return (
    <div className="callout" style={{ borderColor: "var(--bad)" }}>
      <Icon n="info" s={16} />
      <span>
        {error.message}{" "}
        {retry ? (
          <button className="link" onClick={retry}>
            Try again
          </button>
        ) : null}
      </span>
    </div>
  );
}

/* ---------- Toasts ---------- */
const toastSubs = new Set();
let toasts = [];
export function toast(t) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, ...t }];
  toastSubs.forEach((f) => f(toasts));
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== id);
    toastSubs.forEach((f) => f(toasts));
  }, 4600);
}
export const toastError = (e) => toast({ title: e?.message || "Something went wrong", tone: "bad", icon: "info" });
export function Toasts() {
  const [list, setList] = useState(toasts);
  useEffect(() => {
    toastSubs.add(setList);
    return () => toastSubs.delete(setList);
  }, []);
  return (
    <div className="wtoasts" aria-live="polite">
      {list.map((t) => (
        <div className="toast" role="status" key={t.id}>
          <span className={"ti " + (t.tone || "")}>
            <Icon n={t.icon || "check"} s={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <b>{t.title}</b>
            {t.line ? <span>{t.line}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
export function copyText(txt, msg) {
  try {
    navigator.clipboard.writeText(txt).then(
      () => toast({ title: msg || "Copied", icon: "copy", tone: "ok" }),
      () => toast({ title: "Copy blocked by the browser", line: "Select the text and copy it manually", icon: "copy" }),
    );
  } catch {
    toast({ title: "Copy blocked by the browser", icon: "copy" });
  }
}

/* ---------- Overlays ---------- */
export function Modal({ eyebrow, title, sub, onClose, children, foot, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="wlayer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="backdrop" onClick={onClose || undefined} />
      <div className={"modal" + (wide ? " wide" : "")}>
        <div className="modal-h">
          <div style={{ minWidth: 0 }}>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h3>{title}</h3>
            {sub ? <p className="sub">{sub}</p> : null}
          </div>
          {onClose ? (
            <button className="iconbtn sm ring" onClick={onClose} aria-label="Close">
              <Icon n="x" s={17} />
            </button>
          ) : null}
        </div>
        <div className="modal-b">{children}</div>
        {foot ? <div className="modal-f">{foot}</div> : null}
      </div>
    </div>
  );
}
export function Drawer({ eyebrow, title, sub, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="drawer-l" role="dialog" aria-modal="true" aria-label={title}>
      <div className="backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-h">
          <div style={{ minWidth: 0 }}>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h3>{title}</h3>
            {sub ? <p className="sub">{sub}</p> : null}
          </div>
          <button className="iconbtn sm ring" onClick={onClose} aria-label="Close">
            <Icon n="x" s={17} />
          </button>
        </div>
        <div className="drawer-b">{children}</div>
      </div>
    </div>
  );
}
export function CredBox({ rows }) {
  const txt = rows.map((r) => r[0] + ": " + r[1]).join("\n");
  return (
    <div className="cred">
      {rows.map((r) => (
        <div className="cr" key={r[0]}>
          <span>{r[0]}</span>
          <b>{r[1]}</b>
        </div>
      ))}
      <button className="gbtn" onClick={() => copyText(txt, "Login details copied")}>
        <Icon n="copy" s={14} /> Copy login details
      </button>
    </div>
  );
}
export function Confirm({ title, sub, action = "Confirm", danger, onConfirm, onClose, children }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={title}
      sub={sub}
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button
            className={"btn md" + (danger ? " danger" : "")}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onClose();
              } catch (e) {
                toastError(e);
                setBusy(false);
              }
            }}
          >
            {action}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

/* ---------- Lead journey (from the immutable event log) ---------- */
function evView(e) {
  const p = e.payload || {};
  const by = e.actor_kind === "system" ? "Auto-sorted by Keystone" : e.actor_name ? "by " + e.actor_name : "";
  switch (e.kind) {
    case "upload":
      return { icon: "upload", t: p.pool ? "Uploaded to the shared pool" : "Lead uploaded", d: by + (p.pool ? " · first agent to act gets it" : "") };
    case "manual_create":
      return { icon: "phone", t: "Lead created from the dialer", d: by };
    case "call":
      if (e.reason === "connected") return { icon: "phone", t: "Outgoing call · Connected", d: by + " · " + fmtDur(p.duration) };
      return { icon: "phone", t: "Outgoing call · " + (OUTCOME[e.reason] || e.reason), d: by + " · not connected" };
    case "move":
      return {
        icon: "move",
        move: e.to_bucket,
        t: "Moved to " + B(e.to_bucket).label,
        d: [e.reason && (OUTCOME[e.reason] || e.reason), p.scheduled_at ? "for " + fmtWhen(p.scheduled_at) : null, p.visit_date ? "visited " + fmtDate(p.visit_date) : null].filter(Boolean).join(" · "),
        by: p.auto ? "Auto-sorted by Keystone" : by,
        from: e.from_bucket,
        to: e.to_bucket,
        auto: p.auto,
      };
    case "note":
      return { icon: "note", t: "Note added", quote: p.body, d: by };
    case "share":
      return { icon: "chat", t: p.channel === "whatsapp" ? "Shared on WhatsApp" : "Shared from the phone", d: (p.files || []).join(", ") + " · " + by };
    case "claim":
      return { icon: "user", t: "Picked up from the shared pool", d: by };
    case "transfer":
      return {
        icon: "transfer",
        t: "Moved to " + (p.to_agent || "another agent"),
        d: [p.from_agent ? "from " + p.from_agent : null, by, p.as_fresh ? "restarted in Fresh" : null, p.reason === "agent_removed" ? "agent removed" : null].filter(Boolean).join(" · "),
      };
    case "to_tl":
      return { icon: "transfer", t: "Sent to the broker for closing", d: by };
    default:
      return { icon: "info", t: e.kind, d: by };
  }
}
export function LeadJourney({ events }) {
  if (!events?.length) return <p className="hint">No activity yet.</p>;
  const groups = [];
  let cur = null;
  for (const e of events) {
    const k = istDay(e.created_at);
    if (!cur || cur.k !== k) groups.push((cur = { k, items: [] }));
    cur.items.push(e);
  }
  return (
    <div className="journey" style={{ padding: 0 }}>
      {groups.map((g) => {
        const dd = dayDiff(g.items[0].created_at);
        return (
          <div key={g.k}>
            <p className="jday">{dd === 0 ? "Today · " + fmtDate(g.items[0].created_at) : dd === -1 ? "Yesterday · " + fmtDate(g.items[0].created_at) : fmtDate(g.items[0].created_at, true)}</p>
            <div className="jlist">
              {g.items.map((e) => {
                const v = evView(e);
                return (
                  <div className="jev" key={e.id}>
                    <span className={"node" + (v.move ? " move" : "")} style={v.move ? { "--c": B(v.move).c } : undefined}>
                      <Icon n={v.icon} s={16} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="jt">{v.t}</div>
                      {v.d ? <div className="jd">{v.d}</div> : null}
                      {v.from && v.to ? (
                        <div className="arrowto">
                          <Pill b={v.from} />
                          <Icon n="forward" s={14} />
                          <Pill b={v.to} />
                        </div>
                      ) : null}
                      {v.by ? <div className={"jd" + (v.auto ? " auto" : "")}>{v.by}</div> : null}
                      {v.quote ? <div className="quote">{v.quote}</div> : null}
                    </div>
                    <span className="jtime">{fmtTime(e.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
/** One-line status for a lead row, like the tele-caller app shows it. */
export function rowMeta(l) {
  const now = Date.now();
  switch (l.bucket) {
    case "fresh":
      return { text: [l.source, l.configuration].filter(Boolean).join(" · "), tone: "mut" };
    case "rechurn": {
      const locked = l.next_dial_at && Date.parse(l.next_dial_at) > now;
      return { text: (OUTCOME[l.last_reason] || "Unreachable") + " · Dial " + l.attempts + (locked ? " · next " + fmtTime(l.next_dial_at) : ""), tone: locked ? "mut" : "warn" };
    }
    case "followup":
    case "interested":
      if (!l.scheduled_at) return { text: l.last_reason || "", tone: "mut" };
      if (Date.parse(l.scheduled_at) <= now) return { text: "Overdue · " + fmtWhen(l.scheduled_at), tone: "bad" };
      return { text: "Due " + fmtWhen(l.scheduled_at), tone: dayDiff(l.scheduled_at) === 0 ? "gold" : "mut" };
    case "vp":
    case "vc":
      return { text: l.scheduled_at ? "Visit " + fmtWhen(l.scheduled_at) : B(l.bucket).label, tone: l.bucket === "vc" ? "ok" : "mut" };
    case "walkin":
      return { text: l.visit_date ? "Visited " + fmtDate(l.visit_date) : "Visited", tone: "mut" };
    default:
      return { text: OUTCOME[l.last_reason] || l.last_reason || "", tone: "mut" };
  }
}
/** Prototype-style text for the broker's live activity feed. */
export function feedLine(e) {
  const who = <b>{e.actor_name}</b>;
  const p = e.payload || {};
  if (e.kind === "call")
    return e.reason === "connected" ? (
      <>
        {who} spoke to {e.lead_name} for {fmtDur(p.duration)}
      </>
    ) : (
      <>
        {who} called {e.lead_name} · {OUTCOME[e.reason] || e.reason}
      </>
    );
  if (e.kind === "move")
    return p.auto ? (
      <>
        {e.lead_name} auto-sorted to <b>{B(e.to_bucket).label}</b>
      </>
    ) : (
      <>
        {who} moved {e.lead_name} to <b>{B(e.to_bucket).label}</b>
      </>
    );
  if (e.kind === "claim")
    return (
      <>
        {who} picked up {e.lead_name} from the shared pool
      </>
    );
  if (e.kind === "to_tl")
    return (
      <>
        {who} sent walk-in {e.lead_name} to you for closing
      </>
    );
  if (e.kind === "share")
    return (
      <>
        {who} shared {(p.files || []).join(", ")} with {e.lead_name}
      </>
    );
  if (e.kind === "manual_create")
    return (
      <>
        {who} added {e.lead_name} from the dialer
      </>
    );
  return e.kind;
}
export const feedTone = (e) =>
  e.kind === "move" ? (["vp", "vc", "walkin"].includes(e.to_bucket) ? "ok" : ["junk", "failed"].includes(e.to_bucket) ? "bad" : "gold") : e.kind === "call" ? (e.reason === "connected" ? "ok" : "") : "gold";
export const feedIcon = (e) => (e.kind === "call" ? "phone" : e.kind === "move" ? "move" : e.kind === "share" ? "chat" : e.kind === "claim" ? "user" : "transfer");
