import { useState } from "react";
import { api, bump, useApi } from "../api";
import { AvA, Confirm, CredBox, ErrorNote, Icon, Loading, Modal, PLAN_PERF, ago, ageFrom, fmtDate, initials, inr, toast, toastError } from "../lib";
import Agents from "./Agents";

const TABS = [
  ["personal", "Personal information"],
  ["agents", "Active agents"],
  ["dev", "Access to developer"],
  ["plan", "Plan"],
  ["requests", "Requests from agents"],
  ["security", "Password"],
];

export default function Profile({ me, sub, go, reloadMe }) {
  const tab = TABS.some((t) => t[0] === sub) ? sub : "personal";
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{me.firm}</h1>
        </div>
      </div>
      <div className="subnav" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => go("profile", k)}>
            {l}
            {k === "requests" && me.open_support ? ` (${me.open_support})` : ""}
          </button>
        ))}
      </div>
      {tab === "personal" ? <Personal me={me} reloadMe={reloadMe} /> : null}
      {tab === "agents" ? <Agents /> : null}
      {tab === "dev" ? <DevAccess /> : null}
      {tab === "plan" ? <Plan reloadMe={reloadMe} /> : null}
      {tab === "requests" ? <Requests reloadMe={reloadMe} /> : null}
      {tab === "security" ? <Password kind="broker" /> : null}
    </>
  );
}

function shrinkPhoto(file, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = 192,
        c = document.createElement("canvas");
      c.width = c.height = s;
      const k = Math.max(s / img.width, s / img.height),
        w = img.width * k,
        h = img.height * k;
      c.getContext("2d").drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      cb(c.toDataURL("image/jpeg", 0.85));
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

function Personal({ me, reloadMe }) {
  const [f, setF] = useState({
    owner_name: me.owner_name,
    firm: me.firm,
    gender: me.gender || "",
    dob: me.dob ? String(me.dob).slice(0, 10) : "",
    rera: me.rera || "",
    phone: me.phone || "",
    email: me.email || "",
    city: me.city || "",
    localities: (me.localities || []).join(", "),
    photo: me.photo,
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = async () => {
    setBusy(true);
    try {
      await api("broker", "/broker/me", {
        method: "PUT",
        body: { ...f, dob: f.dob || null, email: f.email || null, localities: f.localities.split(",").map((x) => x.trim()).filter(Boolean) },
      });
      toast({ title: "Profile saved", tone: "ok", icon: "check" });
      reloadMe();
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  };
  return (
    <section className="panel" style={{ maxWidth: 780 }}>
      <div className="photo">
        <span className="pv">{f.photo ? <img src={f.photo} alt="Profile photo" /> : initials(f.owner_name)}</span>
        <div>
          <label className="btn sm line" style={{ cursor: "pointer" }}>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && shrinkPhoto(e.target.files[0], (d) => set("photo", d))} />
            <Icon n="camera" s={15} />
            Upload photo
          </label>
          {f.photo ? (
            <button className="link" style={{ marginLeft: 12 }} onClick={() => set("photo", null)}>
              Remove
            </button>
          ) : null}
          <p className="hint" style={{ margin: "6px 0 0" }}>
            Shown to your agents and developers you share data with.
          </p>
        </div>
      </div>
      <div className="wform">
        <div className="wfield">
          <label htmlFor="p-name">Full name</label>
          <input className="winput" id="p-name" value={f.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
        </div>
        <div className="wfield">
          <label htmlFor="p-firm">Firm name</label>
          <input className="winput" id="p-firm" value={f.firm} onChange={(e) => set("firm", e.target.value)} />
        </div>
        <div className="wfield">
          <label htmlFor="p-dob">Date of birth</label>
          <input className="winput" id="p-dob" type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} />
        </div>
        <div className="wfield">
          <label htmlFor="p-age">Age</label>
          <input className="winput" id="p-age" value={ageFrom(f.dob)} readOnly aria-readonly="true" style={{ background: "var(--ivory)" }} />
          <span className="help">Worked out from your date of birth</span>
        </div>
        <div className="wfield">
          <label htmlFor="p-gender">Gender</label>
          <select className="select" id="p-gender" value={f.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Prefer not to say</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div className="wfield">
          <label htmlFor="p-rera">MahaRERA agent number</label>
          <input className="winput mono" id="p-rera" value={f.rera} onChange={(e) => set("rera", e.target.value.toUpperCase())} />
        </div>
        <div className="wfield">
          <label htmlFor="p-phone">Mobile</label>
          <input className="winput" id="p-phone" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="wfield">
          <label htmlFor="p-email">Email</label>
          <input className="winput" id="p-email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="wfield">
          <label htmlFor="p-city">City</label>
          <input className="winput" id="p-city" value={f.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="wfield">
          <label htmlFor="p-loc">Localities you work in</label>
          <input className="winput" id="p-loc" value={f.localities} onChange={(e) => set("localities", e.target.value)} placeholder="Thane West, Powai" />
          <span className="help">Locality-targeted launches reach you for these</span>
        </div>
        <div className="wfield">
          <label>User ID</label>
          <input className="winput mono" value={me.login_id} readOnly style={{ background: "var(--ivory)" }} />
        </div>
      </div>
      <div className="wizard-f">
        <span />
        <button className="btn md" disabled={busy} onClick={save}>
          Save changes
        </button>
      </div>
    </section>
  );
}

function AddDevModal({ suggested, onClose }) {
  const all = useApi("broker", "/broker/projects/options");
  const [dev, setDev] = useState(suggested[0]?.id || "new"),
    [company, setCompany] = useState(""),
    [people, setPeople] = useState([{ name: "", email: "", role: "" }]),
    [done, setDone] = useState(null),
    [busy, setBusy] = useState(false);
  const devs = all.data?.developers || suggested;
  const okPeople = people.filter((p) => p.name.trim().length >= 2);
  const ok = dev !== "new" || (company.trim().length >= 2 && okPeople.length);
  const grant = async () => {
    setBusy(true);
    try {
      const r = await api("broker", "/broker/developers", {
        body: { ...(dev === "new" ? { company: company.trim() } : { developer_id: dev }), users: okPeople.map((p) => ({ name: p.name.trim(), email: p.email.trim(), role: p.role.trim() })) },
      });
      setDone({ company: dev === "new" ? company.trim() : devs.find((d) => d.id === dev)?.company, users: r.users });
      bump();
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  };
  if (done)
    return (
      <Modal eyebrow="Access granted" title={done.company} sub="They can now see performance numbers for your mandates on their projects. No client names or numbers." onClose={onClose} foot={<button className="btn md" onClick={onClose}>Done</button>}>
        {done.users.length ? (
          done.users.map((u) => (
            <div key={u.id}>
              <div className="flabel">
                {u.name}
                {u.role ? " · " + u.role : ""}
              </div>
              <CredBox rows={[["User ID", u.login_id], ["Password", u.password]]} />
            </div>
          ))
        ) : (
          <p className="hint">Their existing team logins now include your mandates.</p>
        )}
        {done.users.length ? <p className="hint">Passwords are shown only now. They sign in at the Developer site.</p> : null}
      </Modal>
    );
  return (
    <Modal
      wide
      eyebrow="Access to developer"
      title="Share performance with a developer"
      sub="View only: calls, connects, visits and walk-ins by agent for mandates on their projects. Never client names or numbers."
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn md" disabled={!ok || busy} onClick={grant}>
            Grant view access
          </button>
        </>
      }
    >
      <div className="wform">
        <div className="wfield">
          <label htmlFor="dev-co">Developer</label>
          <select className="select" id="dev-co" value={dev} onChange={(e) => setDev(e.target.value)}>
            {devs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.company}
              </option>
            ))}
            <option value="new">New developer…</option>
          </select>
        </div>
        {dev === "new" ? (
          <div className="wfield">
            <label htmlFor="dev-new">Company name</label>
            <input className="winput" id="dev-new" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Orchid Crest" />
          </div>
        ) : null}
      </div>
      <div className="flabel">{dev === "new" ? "People to invite" : "Add teammates (optional)"}</div>
      {people.map((p, i) => (
        <div className="wform" key={i} style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", marginBottom: 8 }}>
          <input className="winput" placeholder="Name" value={p.name} onChange={(e) => setPeople(people.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <input className="winput" placeholder="Work email" value={p.email} onChange={(e) => setPeople(people.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
          <input className="winput" placeholder="Role" value={p.role} onChange={(e) => setPeople(people.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
        </div>
      ))}
      <button className="link" style={{ fontSize: 13 }} onClick={() => setPeople([...people, { name: "", email: "", role: "" }])}>
        + Add another person
      </button>
      <p className="hint">Keystone creates a user ID and password for each person. They see only the mandates you run for their projects.</p>
    </Modal>
  );
}

function DevAccess() {
  const { data, error, reload } = useApi("broker", "/broker/developers");
  const [modal, setModal] = useState(null);
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  return (
    <section className="panel">
      <div className="panel-h">
        <div>
          <h2>Developers who can see your numbers</h2>
          <p className="sub">View only. They see calls, connects, site visits and walk-ins by agent, never client names or numbers.</p>
        </div>
        <button className="btn md gold" onClick={() => setModal({ kind: "add" })}>
          <Icon n="plus" s={16} />
          Add developer
        </button>
      </div>
      {data.granted.length ? (
        data.granted.map((d) => (
          <div className="flagrow" key={d.id}>
            <span className="av-sq" style={{ background: "var(--navy)" }}>
              {initials(d.company)}
            </span>
            <div className="fx">
              <b>{d.company}</b>
              <p>{d.users.filter((u) => u.active).map((u) => `${u.name}${u.role ? " · " + u.role : ""} (${u.login_id})`).join(", ") || "No logins yet"}</p>
              <div className="chips2">
                {d.projects.length ? (
                  d.projects.map((p) => (
                    <span key={p} className="mutc">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="hint">No mandate on their projects yet</span>
                )}
                <span className="mutc">since {fmtDate(d.granted_at)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn sm line" onClick={() => setModal({ kind: "user", d })}>
                <Icon n="plus" s={14} />
                Teammate
              </button>
              <button className="btn sm line" style={{ color: "var(--bad)" }} onClick={() => setModal({ kind: "revoke", d })}>
                <Icon n="lock" s={14} />
                Revoke
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="empty-w">You haven’t shared performance with any developer yet.</p>
      )}
      {modal?.kind === "add" ? <AddDevModal suggested={data.suggested} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "user" ? <AddTeammate d={modal.d} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "revoke" ? (
        <Confirm
          title={`Revoke ${modal.d.company}?`}
          sub="They stop seeing your mandates immediately. Their logins stay, in case another broker shares data with them."
          action="Revoke access"
          danger
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api("broker", "/broker/developers/" + modal.d.id, { method: "DELETE" });
            toast({ title: "Access revoked", line: modal.d.company + " no longer sees your numbers", icon: "lock" });
            bump();
          }}
        />
      ) : null}
    </section>
  );
}

function AddTeammate({ d, onClose }) {
  const [f, setF] = useState({ name: "", role: "", email: "" }),
    [made, setMade] = useState(null),
    [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try {
      setMade(await api("broker", `/broker/developers/${d.id}/users`, { body: f }));
      bump();
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  };
  return (
    <Modal
      eyebrow={d.company}
      title={made ? made.name + " can sign in now" : "Add a teammate"}
      onClose={onClose}
      foot={
        made ? (
          <button className="btn md" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button className="btn md line" onClick={onClose}>
              Cancel
            </button>
            <button className="btn md" disabled={f.name.trim().length < 2 || busy} onClick={add}>
              Create login
            </button>
          </>
        )
      }
    >
      {made ? (
        <CredBox rows={[["User ID", made.login_id], ["Password", made.password]]} />
      ) : (
        <div className="wform">
          <div className="wfield">
            <label>Name</label>
            <input className="winput" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="wfield">
            <label>Role</label>
            <input className="winput" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="e.g. Marketing head" />
          </div>
          <div className="wfield full">
            <label>Work email</label>
            <input className="winput" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
        </div>
      )}
    </Modal>
  );
}

function Plan({ reloadMe }) {
  const { data, error, reload } = useApi("broker", "/broker/plan");
  const [pick, setPick] = useState(null);
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const cur = data.current,
    use = data.usage,
    pending = data.orders.find((o) => o.status === "pending");
  const plans = Object.entries(data.plans);
  return (
    <>
      {pending ? (
        <div className="callout" style={{ marginTop: 0 }}>
          <Icon n="clock" s={16} />
          <span>
            Payment pending for <b>{data.plans[pending.plan].name}</b> ({inr(pending.amount)}), requested {ago(pending.created_at)}. Keystone switches your plan as soon as the payment is confirmed.{" "}
            <button
              className="link"
              onClick={async () => {
                await api("broker", "/broker/plan/orders/pending", { method: "DELETE" });
                reload();
              }}
            >
              Cancel request
            </button>
          </span>
        </div>
      ) : null}
      {cur.expired ? (
        <div className="callout" style={{ marginTop: 0, borderColor: "var(--bad)" }}>
          <Icon n="info" s={16} />
          <span>Your {data.plans[cur.chosen].name} plan expired. Basic limits apply until you renew.</span>
        </div>
      ) : null}
      <div className="plans">
        {plans.map(([id, p]) => {
          const isCur = id === cur.chosen && !cur.expired;
          return (
            <div key={id} className={"plan" + (isCur ? " cur" : "")}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{p.name}</h3>
                {isCur ? <span className="okc">Current plan</span> : null}
              </div>
              <div className="pp">
                {inr(p.price)}
                <small> / month</small>
              </div>
              <ul>
                <li>
                  <span>Validity</span>
                  <b>Monthly</b>
                </li>
                <li>
                  <span>Concurrent mandates</span>
                  <b>{p.mandates}</b>
                </li>
                <li>
                  <span>Active agents</span>
                  <b>{p.agents}</b>
                </li>
                <li>
                  <span>Performance summary</span>
                  <b>{PLAN_PERF[p.perf]}</b>
                </li>
              </ul>
              <button className={"btn md" + (p.price > cur.price ? " gold" : " line")} disabled={!!pending} onClick={() => setPick(id)}>
                {isCur ? "Renew for a month" : (p.price > cur.price ? "Upgrade" : "Switch") + " to " + p.name}
              </button>
            </div>
          );
        })}
      </div>
      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h">
          <div>
            <h2>Usage</h2>
            <p className="sub">{cur.valid_until ? `${data.plans[cur.chosen].name} valid until ${fmtDate(cur.valid_until, true)}` : "No expiry set"}</p>
          </div>
        </div>
        <div className="g2e">
          <div className="meter-w">
            <span>
              Live mandates · {use.mandates} of {cur.mandates}
            </span>
            <div className="track">
              <i className={use.mandates > cur.mandates ? "over" : ""} style={{ width: Math.min(100, (use.mandates / cur.mandates) * 100) + "%" }} />
            </div>
          </div>
          <div className="meter-w">
            <span>
              Active agents · {use.agents} of {cur.agents}
            </span>
            <div className="track">
              <i className={use.agents > cur.agents ? "over" : ""} style={{ width: Math.min(100, (use.agents / cur.agents) * 100) + "%" }} />
            </div>
          </div>
        </div>
        {data.orders.length ? (
          <>
            <div className="flabel">Orders</div>
            <div className="tbl-wrap">
              <table className="tbl" style={{ minWidth: 480 }}>
                <tbody>
                  {data.orders.map((o) => (
                    <tr key={o.id}>
                      <td>{data.plans[o.plan].name}</td>
                      <td className="num">{inr(o.amount)}</td>
                      <td>
                        <span className={"status-dot " + (o.status === "paid" ? "" : o.status === "pending" ? "wait" : "off")}>
                          <i />
                          {o.status === "paid" ? "Paid" : o.status === "pending" ? "Payment pending" : "Cancelled"}
                        </span>
                      </td>
                      <td className="muted">{fmtDate(o.paid_at || o.created_at, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>
      {pick ? (
        <Confirm
          title={`Request ${data.plans[pick].name}?`}
          sub={`${inr(data.plans[pick].price)} a month. Keystone confirms the payment and switches your plan; you’ll see it here.`}
          action="Request plan"
          onClose={() => setPick(null)}
          onConfirm={async () => {
            await api("broker", "/broker/plan/orders", { body: { plan: pick } });
            toast({ title: "Plan requested", line: "Payment pending. Keystone will confirm it.", tone: "ok", icon: "crown" });
            reload();
            reloadMe();
          }}
        />
      ) : null}
    </>
  );
}

function Requests({ reloadMe }) {
  const { data, error, reload } = useApi("broker", "/broker/support");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const resolve = async (t) => {
    await api("broker", `/broker/support/${t.id}/resolve`, { body: {} });
    reload();
    reloadMe();
  };
  return (
    <section className="panel">
      <div className="panel-h">
        <div>
          <h2>Requests from agents</h2>
          <p className="sub">Password resets and messages agents send from the app’s Contact us.</p>
        </div>
      </div>
      {data.length ? (
        data.map((t) => (
          <div className="flagrow" key={t.id}>
            <AvA name={t.agent_name || "?"} />
            <div className="fx">
              <b>
                {t.topic} · {t.agent_name}
              </b>
              <p>{t.body}</p>
              <p className="hint" style={{ margin: 0 }}>
                {ago(t.created_at)}
              </p>
            </div>
            {t.status === "open" ? (
              <div style={{ display: "flex", gap: 6 }}>
                {t.topic === "Password reset" ? (
                  <a className="btn sm line" href="#/broker/profile/agents">
                    <Icon n="key" s={14} />
                    Reset in Active agents
                  </a>
                ) : null}
                <button className="btn sm" onClick={() => resolve(t)}>
                  Mark done
                </button>
              </div>
            ) : (
              <span className="okc">
                <Icon n="check" s={12} />
                Done
              </span>
            )}
          </div>
        ))
      ) : (
        <p className="empty-w">No requests.</p>
      )}
    </section>
  );
}

export function Password({ kind }) {
  const [f, setF] = useState({ current: "", next: "", again: "" }),
    [busy, setBusy] = useState(false);
  const ok = f.current && f.next.length >= 8 && f.next === f.again;
  const save = async () => {
    setBusy(true);
    try {
      await api(kind, `/${kind}/password`, { body: { current: f.current, next: f.next } });
      toast({ title: "Password changed", line: "Other devices were signed out", tone: "ok", icon: "key" });
      setF({ current: "", next: "", again: "" });
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  };
  return (
    <section className="panel" style={{ maxWidth: 560 }}>
      <div className="wform" style={{ gridTemplateColumns: "1fr" }}>
        <div className="wfield">
          <label>Current password</label>
          <input className="winput" type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" />
        </div>
        <div className="wfield">
          <label>New password</label>
          <input className="winput" type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} autoComplete="new-password" />
          <span className="help">At least 8 characters</span>
        </div>
        <div className="wfield">
          <label>New password again</label>
          <input className="winput" type="password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} autoComplete="new-password" />
          {f.again && f.again !== f.next ? <span className="err-inline">Passwords don’t match</span> : null}
        </div>
      </div>
      <div className="wizard-f">
        <span />
        <button className="btn md" disabled={!ok || busy} onClick={save}>
          Change password
        </button>
      </div>
    </section>
  );
}
