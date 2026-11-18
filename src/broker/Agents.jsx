import { useState } from "react";
import { api, bump, useApi } from "../api";
import { AvA, CredBox, ErrorNote, Icon, Loading, Modal, ago, firstName, fmtDate, toast, toastError } from "../lib";

export function CreateAgentModal({ onClose, onCreated }) {
  const team = useApi("broker", "/broker/agents");
  const ms = useApi("broker", "/broker/mandates");
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [target, setTarget] = useState(120),
    [sel, setSel] = useState(new Set()),
    [done, setDone] = useState(null),
    [busy, setBusy] = useState(false);
  if (!team.data) return null;
  const plan = team.data.plan,
    n = team.data.usage.agents;
  if (n >= plan.agents && !done)
    return (
      <Modal eyebrow="Create agent" title="Agent limit reached" onClose={onClose} foot={<button className="btn md" onClick={() => (location.hash = "#/broker/profile/plan")}>See plans</button>}>
        <p className="hint">
          Your {plan.name} plan allows {plan.agents} active agents and you have {n}. Upgrade or remove an agent first.
        </p>
      </Modal>
    );
  const ok = name.trim().length > 2 && (!phone || /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10)));
  const create = async () => {
    setBusy(true);
    try {
      const a = await api("broker", "/broker/agents", { body: { name: name.trim(), phone: phone.replace(/\D/g, "").slice(-10), daily_target: Number(target) || 120, mandate_ids: [...sel] } });
      setDone(a);
      onCreated?.(a);
      bump();
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  };
  if (done)
    return (
      <Modal eyebrow="Agent created" title={done.name} sub="Share these with them. They sign in to the tele-caller app with exactly these details." onClose={onClose} foot={<button className="btn md" onClick={onClose}>Done</button>}>
        <CredBox rows={[["User ID", done.login_id], ["Password", done.password]]} />
        <p className="hint" style={{ marginTop: 12 }}>
          This password is shown only now. You can change the user ID or issue a new password any time from Active agents.
        </p>
      </Modal>
    );
  return (
    <Modal
      eyebrow="Create agent"
      title="New tele-caller"
      sub={`${n} of ${plan.agents} agents on your ${plan.name} plan`}
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn md" disabled={!ok || busy} onClick={create}>
            Create and generate login
          </button>
        </>
      }
    >
      <div className="wform">
        <div className="wfield">
          <label htmlFor="na-name">Full name</label>
          <input className="winput" id="na-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pooja Shetty" />
        </div>
        <div className="wfield">
          <label htmlFor="na-phone">Mobile</label>
          <input className="winput" id="na-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
        </div>
        <div className="wfield">
          <label htmlFor="na-target">Daily call target</label>
          <input className="winput" id="na-target" type="number" min="1" max="1000" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div className="wfield full">
          <label>Mandates</label>
          <div className="wrapchips">
            {(ms.data || []).map((m) => {
              const on = sel.has(m.id);
              return (
                <button
                  key={m.id}
                  className={"chip" + (on ? " on" : "")}
                  onClick={() => {
                    const s2 = new Set(sel);
                    on ? s2.delete(m.id) : s2.add(m.id);
                    setSel(s2);
                  }}
                >
                  {m.project}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        Keystone generates a unique user ID and password. They stay the same until you change them.
      </p>
    </Modal>
  );
}

function IdEditor({ a }) {
  const [ed, setEd] = useState(false),
    [v, setV] = useState(a.login_id),
    [err, setErr] = useState("");
  if (!ed)
    return (
      <div className="idedit">
        <span className="mono-id">{a.login_id}</span>
        <button
          className="iconbtn sm"
          onClick={() => {
            setV(a.login_id);
            setErr("");
            setEd(true);
          }}
          aria-label={"Change user ID for " + a.name}
        >
          <Icon n="note" s={15} />
        </button>
      </div>
    );
  const save = async () => {
    const x = v.trim().toLowerCase();
    if (x === a.login_id) return setEd(false);
    try {
      await api("broker", `/broker/agents/${a.id}/login-id`, { body: { login_id: x } });
      toast({ title: "User ID changed", line: `${a.name} now signs in as ${x}. Password unchanged.`, tone: "ok", icon: "key" });
      setEd(false);
      bump();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <div>
      <div className="idedit">
        <input
          className="winput"
          value={v}
          autoFocus
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEd(false);
          }}
        />
        <button className="btn sm" style={{ height: 32 }} onClick={save}>
          Save
        </button>
        <button className="link" style={{ fontSize: 13 }} onClick={() => setEd(false)}>
          Cancel
        </button>
      </div>
      {err ? <span className="err-inline">{err}</span> : null}
    </div>
  );
}

function EditAgentModal({ a, onClose }) {
  const ms = useApi("broker", "/broker/mandates");
  const [name, setName] = useState(a.name),
    [phone, setPhone] = useState(a.phone || ""),
    [target, setTarget] = useState(a.daily_target),
    [sel, setSel] = useState(new Set(a.mandates.map((m) => m.id))),
    [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await api("broker", `/broker/agents/${a.id}`, { method: "PATCH", body: { name: name.trim(), phone: phone.trim(), daily_target: Number(target), mandate_ids: [...sel] } });
      toast({ title: "Saved", line: r.returned_to_pool ? r.returned_to_pool + " open leads went back to the shared pool" : undefined, tone: "ok" });
      bump();
      onClose();
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  };
  return (
    <Modal
      eyebrow="Edit agent"
      title={a.name}
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn md" disabled={busy || name.trim().length < 2} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="wform">
        <div className="wfield">
          <label>Full name</label>
          <input className="winput" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="wfield">
          <label>Mobile</label>
          <input className="winput" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="wfield">
          <label>Daily call target</label>
          <input className="winput" type="number" min="1" max="1000" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div className="wfield full">
          <label>Mandates</label>
          <div className="wrapchips">
            {(ms.data || []).map((m) => {
              const on = sel.has(m.id);
              return (
                <button
                  key={m.id}
                  className={"chip" + (on ? " on" : "")}
                  onClick={() => {
                    const s2 = new Set(sel);
                    on ? s2.delete(m.id) : s2.add(m.id);
                    setSel(s2);
                  }}
                >
                  {m.project}
                </button>
              );
            })}
          </div>
          <span className="help">Taking an agent off a mandate returns their open leads there to the shared pool.</span>
        </div>
      </div>
    </Modal>
  );
}

function RemoveAgentModal({ a, others, onClose }) {
  const [dest, setDest] = useState("pool"),
    [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const r = await api("broker", `/broker/agents/${a.id}/remove`, { body: { to_agent_id: dest === "pool" ? null : dest } });
      toast({ title: a.name + " removed", line: `Access ends now. ${r.returned_to_pool} open leads ${dest === "pool" ? "returned to the shared pool" : "moved to " + others.find((o) => o.id === dest)?.name}.`, tone: "bad", icon: "trash" });
      bump();
      onClose();
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  };
  return (
    <Modal
      eyebrow="Remove agent"
      title={`Remove ${a.name}?`}
      sub="They’re signed out at once and can’t see any project data again. Calls already logged stay in the history."
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn md danger" disabled={busy} onClick={go}>
            Remove {firstName(a.name)}
          </button>
        </>
      }
    >
      <div className="flabel" style={{ marginTop: 0 }}>
        Their {a.leads} leads (open ones) go to
      </div>
      <div className="radios">
        <button className={"radio" + (dest === "pool" ? " on" : "")} onClick={() => setDest("pool")}>
          <span className="dotr" />
          <div>
            <b>The shared pool</b>
            <small>Restarted in Fresh. The first agent on the mandate to act gets each one.</small>
          </div>
        </button>
        {others.map((o) => (
          <button key={o.id} className={"radio" + (dest === o.id ? " on" : "")} onClick={() => setDest(o.id)}>
            <span className="dotr" />
            <div>
              <b>{o.name}</b>
              <small>Keeps each lead’s bucket and schedule</small>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default function Agents() {
  const { data, error, reload } = useApi("broker", "/broker/agents");
  const [modal, setModal] = useState(null);
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const plan = data.plan,
    act = data.items.filter((a) => a.active),
    gone = data.items.filter((a) => !a.active);
  const reset = async (a) => {
    try {
      const r = await api("broker", `/broker/agents/${a.id}/reset-password`, { body: {} });
      setModal({ kind: "pw", a, r });
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <section className="panel">
      <div className="panel-h">
        <div>
          <h2>{act.length} active agents</h2>
          <p className="sub">Agents sign in to the tele-caller app with the user ID and password you give them.</p>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div className="meter-w" style={{ width: 200 }}>
            <span>
              {act.length} of {plan.agents} on {plan.name}
            </span>
            <div className="track">
              <i className={act.length > plan.agents ? "over" : ""} style={{ width: Math.min(100, (act.length / plan.agents) * 100) + "%" }} />
            </div>
          </div>
          <button className="btn md gold" onClick={() => setModal({ kind: "new" })}>
            <Icon n="plus" s={16} />
            Create agent
          </button>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Agent</th>
              <th>User ID</th>
              <th>Password</th>
              <th>Mandates</th>
              <th className="num">Calls today</th>
              <th>Last call</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {act.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="who">
                    <AvA name={a.name} />
                    <div>
                      <b>{a.name}</b>
                      <small>
                        {a.phone || "—"} · target {a.daily_target}/day
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <IdEditor a={a} />
                  {a.login_history.length ? <small className="hint">was {a.login_history.map((h) => h.old).join(", ")}</small> : null}
                </td>
                <td>
                  <div className="idedit">
                    <span className="mono-id">••••••••</span>
                    <button className="link" style={{ fontSize: 13 }} onClick={() => setModal({ kind: "reset", a })}>
                      Reset
                    </button>
                  </div>
                </td>
                <td>
                  {a.mandates.length ? (
                    a.mandates.map((m) => (
                      <span key={m.id} className="mutc" style={{ margin: "2px 4px 2px 0" }}>
                        {m.project}
                      </span>
                    ))
                  ) : (
                    <span className="hint">No mandate yet</span>
                  )}
                </td>
                <td className="num">{a.today.calls}</td>
                <td className="muted">{a.today.last_call ? ago(a.today.last_call) : "—"}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn sm line" onClick={() => setModal({ kind: "edit", a })}>
                    <Icon n="note" s={14} />
                    Edit
                  </button>
                  <button className="btn sm line" style={{ color: "var(--bad)" }} onClick={() => setModal({ kind: "remove", a })}>
                    <Icon n="trash" s={14} />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!act.length ? <p className="empty-w">No agents yet. Create one and share their login.</p> : null}
      {gone.length ? (
        <>
          <div className="flabel" style={{ marginTop: 22 }}>
            Removed agents · no access
          </div>
          {gone.map((a) => (
            <div className="flagrow" key={a.id}>
              <AvA name={a.name} />
              <div className="fx">
                <b>{a.name}</b>
                <p>
                  Removed {a.removed_at ? fmtDate(a.removed_at, true) : ""} · was {a.login_id}
                </p>
              </div>
              <span className="mutc">No access</span>
            </div>
          ))}
        </>
      ) : null}
      {modal?.kind === "new" ? <CreateAgentModal onClose={() => setModal(null)} /> : null}
      {modal?.kind === "edit" ? <EditAgentModal a={modal.a} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "remove" ? <RemoveAgentModal a={modal.a} others={act.filter((x) => x.id !== modal.a.id)} onClose={() => setModal(null)} /> : null}
      {modal?.kind === "reset" ? (
        <Modal
          eyebrow="Reset password"
          title={modal.a.name}
          sub="A new password is generated. The old one stops working and they’re signed out of the app."
          onClose={() => setModal(null)}
          foot={
            <>
              <button className="btn md line" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn md" onClick={() => reset(modal.a)}>
                Issue new password
              </button>
            </>
          }
        />
      ) : null}
      {modal?.kind === "pw" ? (
        <Modal eyebrow="Password reset" title={modal.a.name} sub="Share this with them now. It isn’t shown again." onClose={() => setModal(null)} foot={<button className="btn md" onClick={() => setModal(null)}>Done</button>}>
          <CredBox rows={[["User ID", modal.r.login_id], ["New password", modal.r.password]]} />
        </Modal>
      ) : null}
    </section>
  );
}
