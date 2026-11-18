import { useState } from "react";
import { goTo } from "../nav";
import { api, bump, useApi } from "../api";
import { Confirm, CredBox, ErrorNote, Icon, Loading, Modal, ago, fmtDate, inr, num, toast, toastError } from "../lib";
import { Boot, WebLogin, WebShell, useSession } from "../Shell";

const NAV = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "brokers", label: "Brokers", icon: "briefcase" },
  { id: "orders", label: "Plan payments", icon: "crown" },
  { id: "campaigns", label: "Campaign payments", icon: "megaphone" },
  { id: "developers", label: "Developers", icon: "building" },
  { id: "localities", label: "CP reach", icon: "pin" },
  { id: "activity", label: "Activity", icon: "activity" },
];
const PLAN_NAME = { basic: "Basic", plus: "Plus", pro: "Pro" };

export default function OwnerApp({ page }) {
  const s = useSession("owner");
  if (s.me === undefined) return <Boot />;
  if (!s.me) return <WebLogin kind="owner" idLabel="Email" title="Keystone owner console" lede="Onboard brokers, confirm plan and campaign payments, and keep an eye on the whole platform." onSignIn={s.signIn} />;
  const C = { overview: Overview, brokers: Brokers, orders: Orders, campaigns: CampaignPay, developers: Developers, localities: Localities, activity: Activity }[page] || Overview;
  return (
    <WebShell
      kind="owner"
      nav={NAV}
      page={page}
      go={(p) => goTo("admin/" + p)}
      user={{ name: s.me.name, line: "Keystone owner" }}
      crumb={
        <>
          Keystone · <b>{(NAV.find((n) => n.id === page) || NAV[0]).label}</b>
        </>
      }
      onSignOut={s.signOut}
    >
      <C key={page} />
    </WebShell>
  );
}

const Head = ({ eyebrow, title, sub, children }) => (
  <div className="page-h">
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {sub ? <p className="sub">{sub}</p> : null}
    </div>
    {children ? <div className="acts">{children}</div> : null}
  </div>
);

function Overview() {
  const { data, error, reload } = useApi("owner", "/owner/overview");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  return (
    <>
      <Head eyebrow="Overview" title="The whole platform" />
      <div className="kpis-w">
        <div className="kpi dark">
          <small>Active brokers</small>
          <b>{num(data.brokers)}</b>
          <span>{data.suspended} suspended</span>
        </div>
        <div className="kpi">
          <small>Agents</small>
          <b>{num(data.agents)}</b>
          <span>{num(data.calls_today)} calls today</span>
        </div>
        <div className="kpi">
          <small>Live mandates</small>
          <b>{num(data.mandates)}</b>
          <span>{num(data.leads)} leads</span>
        </div>
        <div className="kpi">
          <small>Developers</small>
          <b>{num(data.developers)}</b>
          <span>on Keystone</span>
        </div>
        <div className="kpi">
          <small>Revenue (paid)</small>
          <b className="small">{inr(Number(data.plan_revenue) + Number(data.campaign_revenue))}</b>
          <span>
            Plans {inr(data.plan_revenue)} · Campaigns {inr(data.campaign_revenue)}
          </span>
        </div>
      </div>
      <div className="g2">
        <section className="panel">
          <div className="panel-h">
            <div>
              <p className="eyebrow">Waiting for you</p>
              <h2>Payments to confirm</h2>
            </div>
          </div>
          <div className="flagrow">
            <span className="av-sq" style={{ background: "var(--navy)" }}>
              <Icon n="crown" s={15} />
            </span>
            <div className="fx">
              <b>{data.pending_orders} plan request(s)</b>
              <p>Brokers waiting for a plan switch or renewal</p>
            </div>
            <a className="btn sm line" href="#/admin/orders">
              Open
            </a>
          </div>
          <div className="flagrow">
            <span className="av-sq" style={{ background: "var(--navy)" }}>
              <Icon n="megaphone" s={15} />
            </span>
            <div className="fx">
              <b>{data.pending_campaigns} campaign(s)</b>
              <p>Developer campaigns that start once paid</p>
            </div>
            <a className="btn sm line" href="#/admin/campaigns">
              Open
            </a>
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">
            <div>
              <p className="eyebrow">Plans</p>
              <h2>Active brokers by plan</h2>
            </div>
          </div>
          {["basic", "plus", "pro"].map((p) => (
            <div className="flagrow" key={p}>
              <div className="fx">
                <b>{PLAN_NAME[p]}</b>
              </div>
              <b>{data.plans.find((x) => x.plan === p)?.n || 0}</b>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function BrokerModal({ b, onClose }) {
  const [f, setF] = useState(
    b
      ? { ...b, email: b.email || "", localities: (b.localities || []).join(", "), plan_valid_until: b.plan_valid_until ? String(b.plan_valid_until).slice(0, 10) : "" }
      : { firm: "", owner_name: "", city: "Mumbai", phone: "", email: "", rera: "", plan: "basic", plan_valid_until: "", localities: "", login_id: "" },
  );
  const [made, setMade] = useState(null),
    [busy, setBusy] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = async () => {
    setBusy(true);
    const body = {
      firm: f.firm.trim(),
      owner_name: f.owner_name.trim(),
      city: f.city.trim(),
      phone: f.phone.trim(),
      email: f.email.trim() || null,
      rera: f.rera.trim(),
      plan: f.plan,
      plan_valid_until: f.plan_valid_until || null,
      localities: f.localities.split(",").map((x) => x.trim()).filter(Boolean),
      ...(f.login_id?.trim() ? { login_id: f.login_id.trim().toLowerCase() } : {}),
    };
    try {
      if (b) {
        await api("owner", "/owner/brokers/" + b.id, { method: "PATCH", body });
        toast({ title: "Broker updated", tone: "ok" });
        bump();
        onClose();
      } else {
        setMade(await api("owner", "/owner/brokers", { body }));
        bump();
      }
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  };
  if (made)
    return (
      <Modal eyebrow="Broker onboarded" title={made.firm} sub="Share these with the broker. They sign in at the Broker site." onClose={onClose} foot={<button className="btn md" onClick={onClose}>Done</button>}>
        <CredBox rows={[["User ID", made.login_id], ["Password", made.password]]} />
        <p className="hint">The password is shown only now. You can issue a new one from the brokers list.</p>
      </Modal>
    );
  return (
    <Modal
      wide
      eyebrow={b ? "Edit broker" : "Onboard broker"}
      title={b ? b.firm : "New broker firm"}
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn md" disabled={busy || f.firm.trim().length < 2 || f.owner_name.trim().length < 2} onClick={save}>
            {b ? "Save" : "Create and generate login"}
          </button>
        </>
      }
    >
      <div className="wform">
        <div className="wfield">
          <label>Firm name</label>
          <input className="winput" value={f.firm} onChange={(e) => set("firm", e.target.value)} />
        </div>
        <div className="wfield">
          <label>Owner name</label>
          <input className="winput" value={f.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
        </div>
        <div className="wfield">
          <label>Mobile</label>
          <input className="winput" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="wfield">
          <label>Email</label>
          <input className="winput" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="wfield">
          <label>City</label>
          <input className="winput" value={f.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="wfield">
          <label>MahaRERA number</label>
          <input className="winput mono" value={f.rera} onChange={(e) => set("rera", e.target.value.toUpperCase())} />
        </div>
        <div className="wfield">
          <label>Plan</label>
          <select className="select" value={f.plan} onChange={(e) => set("plan", e.target.value)}>
            <option value="basic">Basic · ₹999</option>
            <option value="plus">Plus · ₹1,999</option>
            <option value="pro">Pro · ₹2,999</option>
          </select>
        </div>
        <div className="wfield">
          <label>Plan valid until</label>
          <input className="winput" type="date" value={f.plan_valid_until} onChange={(e) => set("plan_valid_until", e.target.value)} />
          <span className="help">{b ? "Leave empty for no expiry" : "Empty = 30 days from today"}</span>
        </div>
        <div className="wfield">
          <label>Localities</label>
          <input className="winput" value={f.localities} onChange={(e) => set("localities", e.target.value)} placeholder="Thane West, Powai" />
        </div>
        <div className="wfield">
          <label>User ID</label>
          <input className="winput mono" value={f.login_id || ""} onChange={(e) => set("login_id", e.target.value)} placeholder={b ? "" : "Generated from the owner name"} />
        </div>
      </div>
    </Modal>
  );
}

function Brokers() {
  const [q, setQ] = useState("");
  const { data, error, reload } = useApi("owner", "/owner/brokers?q=" + encodeURIComponent(q), [q]);
  const [modal, setModal] = useState(null);
  const resetPw = async (b) => {
    try {
      const r = await api("owner", `/owner/brokers/${b.id}/reset-password`, { body: {} });
      setModal({ kind: "pw", b, r });
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <>
      <Head eyebrow="Brokers" title="Broker firms on Keystone">
        <button className="btn md gold" onClick={() => setModal({ kind: "new" })}>
          <Icon n="plus" s={16} />
          Onboard broker
        </button>
      </Head>
      <section className="panel">
        <div className="ctrls-row">
          <div className="search-w">
            <Icon n="search" s={16} />
            <input placeholder="Search firm, owner or user ID" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {!data ? (
          error ? (
            <ErrorNote error={error} retry={reload} />
          ) : (
            <Loading />
          )
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Firm</th>
                  <th>User ID</th>
                  <th>Plan</th>
                  <th className="num">Agents</th>
                  <th className="num">Mandates</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="who">
                        <div>
                          <b>{b.firm}</b>
                          <small>
                            {b.owner_name} · {b.city}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{b.login_id}</td>
                    <td>
                      {PLAN_NAME[b.plan]}
                      <small className="hint" style={{ display: "block" }}>
                        {b.plan_valid_until ? "until " + fmtDate(b.plan_valid_until, true) : "no expiry"}
                      </small>
                    </td>
                    <td className="num">{b.agents}</td>
                    <td className="num">{b.mandates}</td>
                    <td>
                      <span className={"status-dot" + (b.status === "active" ? "" : " off")}>
                        <i />
                        {b.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn sm line" onClick={() => setModal({ kind: "edit", b })}>
                        Edit
                      </button>
                      <button className="btn sm line" onClick={() => resetPw(b)}>
                        New password
                      </button>
                      <button className="btn sm line" style={b.status === "active" ? { color: "var(--bad)" } : undefined} onClick={() => setModal({ kind: "status", b })}>
                        {b.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal?.kind === "new" ? <BrokerModal onClose={() => setModal(null)} /> : null}
      {modal?.kind === "edit" ? <BrokerModal b={modal.b} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "pw" ? (
        <Modal eyebrow="New password" title={modal.b.firm} sub="The old password stops working now." onClose={() => setModal(null)} foot={<button className="btn md" onClick={() => setModal(null)}>Done</button>}>
          <CredBox rows={[["User ID", modal.r.login_id], ["Password", modal.r.password]]} />
        </Modal>
      ) : null}
      {modal?.kind === "status" ? (
        <Confirm
          title={modal.b.status === "active" ? `Suspend ${modal.b.firm}?` : `Reactivate ${modal.b.firm}?`}
          sub={modal.b.status === "active" ? "The broker and all their agents are signed out at once and can’t sign in. Their data is kept." : "The broker and their agents can sign in again."}
          action={modal.b.status === "active" ? "Suspend" : "Reactivate"}
          danger={modal.b.status === "active"}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api("owner", "/owner/brokers/" + modal.b.id, { method: "PATCH", body: { status: modal.b.status === "active" ? "suspended" : "active" } });
            bump();
          }}
        />
      ) : null}
    </>
  );
}

function Orders() {
  const { data, error, reload } = useApi("owner", "/owner/orders");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const act = async (o, what) => {
    try {
      await api("owner", `/owner/orders/${o.id}/${what}`, { body: {} });
      toast({ title: what === "paid" ? `${o.firm} is on ${PLAN_NAME[o.plan]}` : "Request cancelled", tone: what === "paid" ? "ok" : undefined, icon: "crown" });
      bump();
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <>
      <Head eyebrow="Plan payments" title="Broker plan requests" sub="No payment gateway yet: confirm once the money arrives. Confirming switches the plan and extends it by a month." />
      <section className="panel">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Broker</th>
                <th>Requested</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.firm}</b>
                    <small className="hint" style={{ display: "block" }}>
                      {o.owner_name} · now on {PLAN_NAME[o.current_plan]}
                    </small>
                  </td>
                  <td>{PLAN_NAME[o.plan]}</td>
                  <td className="num">{inr(o.amount)}</td>
                  <td>
                    <span className={"status-dot " + (o.status === "paid" ? "" : o.status === "pending" ? "wait" : "off")}>
                      <i />
                      {o.status === "paid" ? "Paid" : o.status === "pending" ? "Pending" : "Cancelled"}
                    </span>
                  </td>
                  <td className="muted">{ago(o.paid_at || o.created_at)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {o.status === "pending" ? (
                      <>
                        <button className="btn sm" onClick={() => act(o, "paid")}>
                          Mark paid
                        </button>
                        <button className="btn sm line" onClick={() => act(o, "cancel")}>
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.length ? <p className="empty-w">No plan requests yet.</p> : null}
      </section>
    </>
  );
}

function CampaignPay() {
  const { data, error, reload } = useApi("owner", "/owner/campaigns");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const act = async (c, what) => {
    try {
      await api("owner", `/owner/campaigns/${c.id}/${what}`, { body: {} });
      toast({ title: what === "paid" ? `${c.project} is live in brokers’ decks` : "Campaign cancelled", tone: what === "paid" ? "ok" : undefined, icon: "megaphone" });
      bump();
    } catch (e) {
      toastError(e);
    }
  };
  const scope = (c) => (c.scope === "locality" ? c.locality : c.scope === "state" ? "Maharashtra" : "All India");
  return (
    <>
      <Head eyebrow="Campaign payments" title="Developer campaigns" sub="Prepaid. Confirming the payment starts the campaign for its booked number of days." />
      <section className="panel">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Audience</th>
                <th className="num">Days</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th className="num">Brokers in</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.project}</b>
                    <small className="hint" style={{ display: "block" }}>
                      {c.developer} · {c.headline}
                    </small>
                  </td>
                  <td>
                    {scope(c)} · {num(c.reach)}
                  </td>
                  <td className="num">{c.days}</td>
                  <td className="num">{inr(c.total)}</td>
                  <td>
                    <span className={"status-dot " + (c.payment_status === "paid" ? "" : c.payment_status === "pending" ? "wait" : "off")}>
                      <i />
                      {c.payment_status === "paid" ? (c.ends_at && Date.parse(c.ends_at) < Date.now() ? "Ended" : "Live") : c.payment_status === "pending" ? "Pending" : "Cancelled"}
                    </span>
                  </td>
                  <td className="num">{c.accepted}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {c.payment_status === "pending" ? (
                      <>
                        <button className="btn sm" onClick={() => act(c, "paid")}>
                          Mark paid
                        </button>
                        <button className="btn sm line" onClick={() => act(c, "cancel")}>
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.length ? <p className="empty-w">No campaigns yet.</p> : null}
      </section>
    </>
  );
}

function Developers() {
  const { data, error, reload } = useApi("owner", "/owner/developers");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  return (
    <>
      <Head eyebrow="Developers" title="Developers on Keystone" sub="Brokers add developers and their teams when they share performance." />
      <section className="panel">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Company</th>
                <th className="num">Logins</th>
                <th className="num">Projects</th>
                <th className="num">Brokers sharing</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td>
                    <b>{d.company}</b>
                  </td>
                  <td className="num">{d.users}</td>
                  <td className="num">{d.projects}</td>
                  <td className="num">{d.brokers}</td>
                  <td className="muted">{fmtDate(d.created_at, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Localities() {
  const { data, error, reload } = useApi("owner", "/owner/localities");
  const [f, setF] = useState({ name: "", city: "Mumbai", cp_reach: "" });
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const save = async (row) => {
    try {
      await api("owner", "/owner/localities", { method: "PUT", body: { ...row, cp_reach: Number(row.cp_reach) } });
      toast({ title: "Saved " + row.name, tone: "ok" });
      bump();
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <>
      <Head eyebrow="CP reach" title="Channel partners per locality" sub="Used to estimate audience and price for locality campaigns. Maharashtra uses 46,200 and All India 118,500." />
      <section className="panel" style={{ maxWidth: 760 }}>
        <div className="tbl-wrap">
          <table className="tbl" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>Locality</th>
                <th>City</th>
                <th className="num">Active CPs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <LocRow key={l.name} l={l} save={save} />
              ))}
              <tr>
                <td>
                  <input className="winput" placeholder="New locality" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                </td>
                <td>
                  <input className="winput" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
                </td>
                <td>
                  <input className="winput" type="number" value={f.cp_reach} onChange={(e) => setF({ ...f, cp_reach: e.target.value })} />
                </td>
                <td>
                  <button
                    className="btn sm"
                    disabled={f.name.trim().length < 2 || !(Number(f.cp_reach) > 0)}
                    onClick={() => {
                      save(f);
                      setF({ name: "", city: "Mumbai", cp_reach: "" });
                    }}
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function LocRow({ l, save }) {
  const [v, setV] = useState(l.cp_reach);
  return (
    <tr>
      <td>
        <b>{l.name}</b>
      </td>
      <td>{l.city}</td>
      <td className="num">
        <input className="winput" type="number" style={{ width: 120, textAlign: "right" }} value={v} onChange={(e) => setV(e.target.value)} />
      </td>
      <td>
        {Number(v) !== l.cp_reach ? (
          <button className="btn sm" onClick={() => save({ ...l, cp_reach: v })}>
            Save
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function Activity() {
  const { data, error, reload } = useApi("owner", "/owner/activity");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  return (
    <>
      <Head eyebrow="Activity" title="Recent changes" sub="An append-only record of account, plan and payment changes." />
      <section className="panel">
        {data.map((x) => (
          <div className="flagrow" key={x.id}>
            <span className="mutc">{x.actor_kind}</span>
            <div className="fx">
              <b>
                {x.action}
                {x.firm ? " · " + x.firm : ""}
              </b>
              <p className="mono" style={{ fontSize: 12 }}>
                {JSON.stringify(x.details)}
              </p>
            </div>
            <small className="hint">{ago(x.created_at)}</small>
          </div>
        ))}
        {!data.length ? <p className="empty-w">Nothing yet.</p> : null}
      </section>
    </>
  );
}
