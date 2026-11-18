import { useEffect, useState } from "react";
import { api, bump, useApi } from "../api";
import { Art, Confirm, ErrorNote, Icon, Loading, Locked2, Modal, fmtDate, inr, num, pct, toast, toastError } from "../lib";
import { SwipeCard } from "../broker/Launches";
import { scopeLabel } from "./Home";

export default function Campaigns({ sub, go, me }) {
  if (sub === "new") return <NewCampaign go={go} me={me} />;
  return <CampaignList go={go} />;
}

function CampaignList({ go }) {
  const { data, error, reload } = useApi("developer", "/developer/campaigns");
  const [withdraw, setWithdraw] = useState(null);
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const paid = data.filter((c) => c.payment_status === "paid");
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Campaigns</p>
          <h1>Reach channel partners</h1>
          <p className="sub">Paid promotions land in brokers’ New Launches deck. Brokers who participate pass them to their agents.</p>
        </div>
        <div className="acts">
          <button className="btn md gold" onClick={() => go("campaigns", "new")}>
            <Icon n="plus" s={17} />
            Create campaign
          </button>
        </div>
      </div>
      <div className="kpis-w">
        <div className="kpi dark">
          <small>Live campaigns</small>
          <b>{data.filter((c) => c.live).length}</b>
          <span>{data.length} in total</span>
        </div>
        <div className="kpi">
          <small>Brokers participating</small>
          <b>{num(data.reduce((s, c) => s + c.accepted, 0))}</b>
          <span>across all campaigns</span>
        </div>
        <div className="kpi">
          <small>Prepaid spend</small>
          <b>{inr(paid.reduce((s, c) => s + Number(c.total), 0))}</b>
          <span>incl. GST</span>
        </div>
      </div>
      {data.length ? (
        <div className="stack">
          {data.map((c) => {
            const pending = c.payment_status === "pending";
            return (
              <section className="panel" key={c.id}>
                <div className="mhead">
                  <Art id={c.project_id} locality={c.locality || ""} />
                  <div className="mt">
                    <p className="eyebrow">{pending ? "Waiting for payment confirmation" : c.live ? `Live · ${c.days_left} day${c.days_left === 1 ? "" : "s"} left` : c.payment_status === "cancelled" ? "Cancelled" : "Ended"}</p>
                    <h2>{c.project}</h2>
                    <p className="sub">{c.headline}</p>
                  </div>
                  {pending ? (
                    <button className="btn sm line" onClick={() => setWithdraw(c)}>
                      Withdraw
                    </button>
                  ) : c.live ? (
                    <span className="okc">
                      <Icon n="activity" s={12} />
                      Live
                    </span>
                  ) : (
                    <span className="mutc">{c.payment_status === "cancelled" ? "Cancelled" : "Ended"}</span>
                  )}
                </div>
                <div className="kpis-w" style={{ margin: "16px 0 0", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
                  <div className="kpi">
                    <small>Audience</small>
                    <b>{num(c.reach)}</b>
                    <span>{scopeLabel(c)}</span>
                  </div>
                  <div className="kpi">
                    <small>Participating</small>
                    <b>{num(c.accepted)}</b>
                    <span>{c.rejected} passed</span>
                  </div>
                  <div className="kpi">
                    <small>Response rate</small>
                    <b>{pct(c.accepted, c.accepted + c.rejected)}%</b>
                    <span>of brokers who decided</span>
                  </div>
                  <div className="kpi">
                    <small>Runs</small>
                    <b>{c.days}d</b>
                    <span>{c.starts_at ? `${fmtDate(c.starts_at)} to ${fmtDate(c.ends_at)}` : "Starts after payment"}</span>
                  </div>
                  <div className="kpi">
                    <small>{pending ? "To pay" : "Paid"}</small>
                    <b>{inr(c.total)}</b>
                    <span>incl. GST</span>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Locked2 icon="megaphone" title="No campaigns yet" text="Create one to put a launch in front of active brokers." cta="Create campaign" onCta={() => go("campaigns", "new")} />
      )}
      {withdraw ? (
        <Confirm
          title="Withdraw this campaign?"
          sub="It hasn’t been paid for yet, so nothing is charged."
          action="Withdraw"
          danger
          onClose={() => setWithdraw(null)}
          onConfirm={async () => {
            await api("developer", "/developer/campaigns/" + withdraw.id, { method: "DELETE" });
            toast({ title: "Campaign withdrawn", icon: "x" });
            bump();
          }}
        />
      ) : null}
    </>
  );
}

function NewCampaign({ go, me }) {
  const projects = useApi("developer", "/developer/projects");
  const locs = useApi("developer", "/developer/localities");
  const [pid, setPid] = useState(null),
    [np, setNp] = useState({ name: "", locality: "", configurations: "2 & 3 BHK", price_from: "", possession: "" }),
    [headline, setHeadline] = useState(""),
    [message, setMessage] = useState("3% brokerage for partner bookings"),
    [scope, setScope] = useState("state"),
    [days, setDays] = useState(15),
    [q, setQ] = useState(null),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false);
  const list = projects.data || [];
  const cur = pid && pid !== "new" ? list.find((p) => p.id === pid) : null;
  const isNew = pid === "new" || (!list.length && projects.data);
  const locality = isNew ? np.locality : cur?.locality;
  const knownLocality = (locs.data || []).some((l) => l.name === locality);
  useEffect(() => {
    if (!pid && list.length) setPid(list[list.length - 1].id);
  }, [list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const effScope = scope === "locality" && !knownLocality ? "state" : scope;
  useEffect(() => {
    const t = setTimeout(() => {
      api("developer", "/developer/campaigns/quote", { body: { scope: effScope, locality: effScope === "locality" ? locality : null, days } })
        .then(setQ)
        .catch(() => setQ(null));
    }, 200);
    return () => clearTimeout(t);
  }, [effScope, locality, days]);
  if (!projects.data || !locs.data) return <Loading />;
  const name = isNew ? np.name : cur?.name;
  const head = headline || (name ? `${name}: ${(cur?.tag || "New launch").toLowerCase()} in ${locality || "Mumbai"}` : "");
  const ok = head.trim().length >= 4 && (isNew ? np.name.trim() && np.locality : cur) && q;
  const localityReach = (locs.data || []).find((l) => l.name === locality)?.cp_reach;
  const opts = [
    ["locality", "Locality", knownLocality ? locality + " and nearby" : "Pick a project in a listed locality", localityReach],
    ["state", "Maharashtra", "Every active broker in the state", 46200],
    ["india", "All India", "Every active broker on Keystone", 118500],
  ];
  const submit = async () => {
    setBusy(true);
    try {
      let projectId = cur?.id;
      if (isNew) {
        const p = await api("developer", "/developer/projects", {
          body: { name: np.name.trim(), locality: np.locality, city: (locs.data.find((l) => l.name === np.locality) || {}).city || "Mumbai", configurations: np.configurations.split(/[,&]/).map((x) => x.trim()).filter(Boolean).map((x) => (/bhk|villa|plot|shop/i.test(x) ? x : x + " BHK")), price_from: np.price_from, possession: np.possession, tag: "New launch" },
        });
        projectId = p.id;
      }
      const c = await api("developer", "/developer/campaigns", { body: { project_id: projectId, headline: head.trim(), message: message.trim(), scope: effScope, locality: effScope === "locality" ? locality : null, days } });
      toast({ title: "Campaign created", line: `${inr(c.total)} to pay. It goes live in brokers’ decks as soon as Keystone confirms the payment.`, tone: "ok", icon: "megaphone" });
      bump();
      go("campaigns");
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  };
  const preview = {
    id: "preview",
    project_id: cur?.id || "preview-" + np.name,
    name: name || "Your project",
    developer: me.company,
    project_locality: locality || "—",
    tag: cur?.tag || "New launch",
    headline: head || "Your headline",
    message,
    highlights: cur?.highlights?.length ? cur.highlights : [message].filter(Boolean),
    price_from: isNew ? np.price_from : cur?.price_from,
    configurations: isNew ? [np.configurations] : cur?.configurations,
    possession: isNew ? np.possession : cur?.possession,
    ends_at: new Date(Date.now() + days * 86400000).toISOString(),
  };
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">New campaign</p>
          <h1>Promote a project to brokers</h1>
          <p className="sub">Prepaid. Price depends on audience size and how many days it runs.</p>
        </div>
        <div className="acts">
          <button className="btn md line" onClick={() => go("campaigns")}>
            Cancel
          </button>
        </div>
      </div>
      <div className="g2">
        <div className="stack">
          <section className="panel">
            <p className="eyebrow">1 · Project</p>
            <div className="wrapchips" style={{ marginTop: 10 }}>
              {list.map((p) => (
                <button
                  key={p.id}
                  className={"chip" + (pid === p.id ? " on" : "")}
                  onClick={() => {
                    setPid(p.id);
                    setHeadline("");
                  }}
                >
                  {p.name}
                </button>
              ))}
              <button
                className={"chip" + (isNew ? " on" : "")}
                onClick={() => {
                  setPid("new");
                  setHeadline("");
                }}
              >
                <Icon n="plus" s={13} />
                New project
              </button>
            </div>
            {isNew ? (
              <div className="wform" style={{ marginTop: 14 }}>
                <div className="wfield">
                  <label>Project name</label>
                  <input className="winput" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} placeholder="e.g. Sterling Riverside" />
                </div>
                <div className="wfield">
                  <label>Location</label>
                  <select className="select" value={np.locality} onChange={(e) => setNp({ ...np, locality: e.target.value })}>
                    <option value="">Choose locality</option>
                    {locs.data.map((l) => (
                      <option key={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="wfield">
                  <label>Configurations</label>
                  <input className="winput" value={np.configurations} onChange={(e) => setNp({ ...np, configurations: e.target.value })} />
                </div>
                <div className="wfield">
                  <label>Price from</label>
                  <input className="winput" value={np.price_from} onChange={(e) => setNp({ ...np, price_from: e.target.value })} placeholder="e.g. ₹78 L" />
                </div>
                <div className="wfield">
                  <label>Possession</label>
                  <input className="winput" value={np.possession} onChange={(e) => setNp({ ...np, possession: e.target.value })} placeholder="e.g. Dec 2029" />
                </div>
              </div>
            ) : cur ? (
              <p className="sub" style={{ marginTop: 10 }}>
                <Icon n="pin" s={14} /> {[cur.locality, cur.configurations.join(", "), cur.price_from ? "from " + cur.price_from : null, cur.possession ? "possession " + cur.possession : null].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </section>
          <section className="panel">
            <p className="eyebrow">2 · Message to brokers</p>
            <div className="wform" style={{ marginTop: 10 }}>
              <div className="wfield full">
                <label>Headline</label>
                <input className="winput" value={head} onChange={(e) => setHeadline(e.target.value)} maxLength={120} />
              </div>
              <div className="wfield full">
                <label>Brokerage, bonus or offer</label>
                <textarea className="winput" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} placeholder="e.g. 3% brokerage, ₹50,000 bonus on each booking" />
              </div>
            </div>
          </section>
          <section className="panel">
            <p className="eyebrow">3 · Who sees it</p>
            <div className="radios" style={{ marginTop: 10 }}>
              {opts.map(([k, t, d, reach]) => (
                <button key={k} className={"radio" + (effScope === k ? " on" : "")} disabled={k === "locality" && !knownLocality} onClick={() => setScope(k)}>
                  <span className="dotr" />
                  <div>
                    <b>{t}</b>
                    <small>{d}</small>
                  </div>
                  {reach ? (
                    <span className="rr">
                      ≈ {num(reach)}
                      <small> CPs</small>
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <p className="hint">Active channel partners on Keystone.</p>
          </section>
          <section className="panel">
            <p className="eyebrow">4 · How long</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              <input type="range" min="3" max="60" value={days} onChange={(e) => setDays(+e.target.value)} style={{ flex: 1, minWidth: 200, accentColor: "#0E1A2B" }} aria-label="Campaign days" />
              <b style={{ fontFamily: "var(--f-display)", fontWeight: 400, fontSize: 28, minWidth: 90 }}>{days} days</b>
            </div>
            <div className="wrapchips" style={{ marginTop: 10 }}>
              {[
                [7, "5% off"],
                [14, "10% off"],
                [30, "20% off"],
              ].map(([x, d]) => (
                <button key={x} className={"chip" + (days === x ? " on" : "")} onClick={() => setDays(x)}>
                  {x} days · {d}
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="stack" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <section className="panel">
            <p className="eyebrow">Estimate</p>
            {q ? (
              <>
                <h2 style={{ marginTop: 3 }}>
                  {num(q.reach)} brokers for {days} days
                </h2>
                <div className="summ" style={{ marginTop: 12 }}>
                  <div>
                    <span>Audience</span>
                    <b>{num(q.reach)} CPs</b>
                  </div>
                  <div>
                    <span>Rate</span>
                    <b>₹{Number(q.rate).toFixed(2)} per CP per day</b>
                  </div>
                  <div>
                    <span>
                      {num(q.reach)} × {days} days
                    </span>
                    <b>{inr(q.gross)}</b>
                  </div>
                  {q.discount ? (
                    <div>
                      <span>Duration discount ({Math.round(q.discount_pct * 100)}%)</span>
                      <b style={{ color: "var(--ok)" }}>− {inr(q.discount)}</b>
                    </div>
                  ) : null}
                  <div>
                    <span>GST 18%</span>
                    <b>{inr(q.gst)}</b>
                  </div>
                  <div className="tot">
                    <span>Prepaid total</span>
                    <b>{inr(q.total)}</b>
                  </div>
                </div>
              </>
            ) : (
              <p className="hint">Working out the price…</p>
            )}
            <button className="btn md gold block" style={{ marginTop: 12 }} disabled={!ok} onClick={() => setConfirm(true)}>
              <Icon n="megaphone" s={17} />
              Create & pay
            </button>
            <p className="hint" style={{ margin: "10px 0 0" }}>
              Rate card: locality ₹2, state ₹1.20, India ₹0.80 per CP per day. 5% off from 7 days, 10% from 14, 20% from 28.
            </p>
          </section>
          <section className="panel">
            <p className="eyebrow">Preview in brokers’ deck</p>
            <div style={{ height: 420, position: "relative", marginTop: 12 }}>
              <SwipeCard c={preview} style={{ cursor: "default" }} />
            </div>
          </section>
        </div>
      </div>
      {confirm && q ? (
        <Modal
          eyebrow="Confirm"
          title={`Create campaign for ${inr(q.total)}?`}
          sub="Payment is confirmed by Keystone (no online payment yet). The campaign starts in brokers’ decks once it’s confirmed."
          onClose={() => setConfirm(false)}
          foot={
            <>
              <button className="btn md line" onClick={() => setConfirm(false)}>
                Back
              </button>
              <button className="btn md gold" disabled={busy} onClick={submit}>
                Create campaign
              </button>
            </>
          }
        >
          <div className="summ">
            <div>
              <span>Project</span>
              <b>{name}</b>
            </div>
            <div>
              <span>Audience</span>
              <b>
                {opts.find((o) => o[0] === effScope)[1]} · {num(q.reach)} CPs
              </b>
            </div>
            <div>
              <span>Runs</span>
              <b>{days} days from confirmation</b>
            </div>
            <div className="tot">
              <span>Total</span>
              <b>{inr(q.total)}</b>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
