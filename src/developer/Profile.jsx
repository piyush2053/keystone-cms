import { useState } from "react";
import { api, bump, useApi } from "../api";
import { AvA, CredBox, ErrorNote, Icon, Loading, Modal, toast, toastError } from "../lib";
import { Password } from "../broker/Profile";

const TABS = [
  ["company", "Company"],
  ["me", "Your details"],
  ["team", "Teammates"],
  ["security", "Password"],
];

export default function DevProfile({ me, sub, go, reloadMe }) {
  const tab = TABS.some((t) => t[0] === sub) ? sub : "company";
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{me.company}</h1>
        </div>
      </div>
      <div className="subnav" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => go("profile", k)}>
            {l}
          </button>
        ))}
      </div>
      {tab === "company" ? <Company me={me} /> : null}
      {tab === "me" ? <Me me={me} reloadMe={reloadMe} /> : null}
      {tab === "team" ? <Team me={me} /> : null}
      {tab === "security" ? <Password kind="developer" /> : null}
    </>
  );
}

function Company({ me }) {
  const ms = useApi("developer", "/developer/mandates");
  const ps = useApi("developer", "/developer/projects");
  if (!ms.data || !ps.data) return <Loading />;
  const brokers = [...new Set(ms.data.map((m) => m.broker))];
  return (
    <section className="panel" style={{ maxWidth: 820 }}>
      <div className="summ">
        <div>
          <span>Company</span>
          <b>{me.company}</b>
        </div>
        <div>
          <span>City</span>
          <b>{me.city || "—"}</b>
        </div>
        <div>
          <span>Projects</span>
          <b>{ps.data.map((p) => p.name).join(", ") || "None yet"}</b>
        </div>
        <div>
          <span>Brokers sharing data</span>
          <b>{brokers.join(", ") || "None yet"}</b>
        </div>
        <div>
          <span>Mandates you can see</span>
          <b>{ms.data.map((m) => `${m.project} (${m.broker.split(" ")[0]})`).join(", ") || "—"}</b>
        </div>
      </div>
    </section>
  );
}

function Me({ me, reloadMe }) {
  const [f, setF] = useState({ name: me.name, role: me.role || "", email: me.email || "", phone: me.phone || "" });
  const save = async () => {
    try {
      await api("developer", "/developer/me", { method: "PUT", body: f });
      toast({ title: "Details saved", tone: "ok", icon: "check" });
      reloadMe();
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <section className="panel" style={{ maxWidth: 780 }}>
      <div className="wform">
        <div className="wfield">
          <label>Name</label>
          <input className="winput" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="wfield">
          <label>Role</label>
          <input className="winput" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
        </div>
        <div className="wfield">
          <label>Work email</label>
          <input className="winput" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <div className="wfield">
          <label>Mobile</label>
          <input className="winput" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <div className="wfield">
          <label>User ID</label>
          <input className="winput mono" value={me.login_id} readOnly style={{ background: "var(--ivory)" }} />
        </div>
      </div>
      <div className="wizard-f">
        <span />
        <button className="btn md" disabled={f.name.trim().length < 2} onClick={save}>
          Save changes
        </button>
      </div>
    </section>
  );
}

function Team({ me }) {
  const { data, error, reload } = useApi("developer", "/developer/team");
  const [adding, setAdding] = useState(false),
    [f, setF] = useState({ name: "", email: "", role: "" }),
    [made, setMade] = useState(null);
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const add = async () => {
    try {
      setMade(await api("developer", "/developer/team", { body: f }));
      setF({ name: "", email: "", role: "" });
      bump();
    } catch (e) {
      toastError(e);
    }
  };
  const setActive = async (u, active) => {
    try {
      await api("developer", "/developer/team/" + u.id, { method: "PATCH", body: { active } });
      toast({ title: active ? u.name + " can sign in again" : u.name + " removed", line: active ? undefined : "Their login stops working now", icon: active ? "check" : "trash" });
      bump();
    } catch (e) {
      toastError(e);
    }
  };
  const act = data.filter((u) => u.active);
  return (
    <section className="panel">
      <div className="panel-h">
        <div>
          <h2>
            {act.length} people at {me.company}
          </h2>
          <p className="sub">Everyone here sees the same mandates, view only.</p>
        </div>
        <button
          className="btn md gold"
          onClick={() => {
            setAdding(true);
            setMade(null);
          }}
        >
          <Icon n="plus" s={16} />
          Add teammate
        </button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>User ID</th>
              <th>Added by</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((x) => (
              <tr key={x.id} style={x.active ? undefined : { opacity: 0.55 }}>
                <td>
                  <div className="who">
                    <AvA name={x.name} />
                    <b>
                      {x.name}
                      {x.id === me.id ? " (you)" : ""}
                    </b>
                  </div>
                </td>
                <td>{x.role || "—"}</td>
                <td className="muted">{x.email || "—"}</td>
                <td className="mono">{x.login_id}</td>
                <td>{x.added_by_broker ? "Broker invite · " + x.added_by_broker : x.added_by ? x.added_by : "Your team"}</td>
                <td style={{ textAlign: "right" }}>
                  {x.id !== me.id ? (
                    x.active ? (
                      <button className="btn sm line" style={{ color: "var(--bad)" }} onClick={() => setActive(x, false)}>
                        <Icon n="trash" s={14} />
                        Remove
                      </button>
                    ) : (
                      <button className="btn sm line" onClick={() => setActive(x, true)}>
                        Restore
                      </button>
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding ? (
        <Modal
          eyebrow="Add teammate"
          title={made ? made.name + " can sign in now" : "Give a colleague access"}
          onClose={() => setAdding(false)}
          foot={
            made ? (
              <button className="btn md" onClick={() => setAdding(false)}>
                Done
              </button>
            ) : (
              <>
                <button className="btn md line" onClick={() => setAdding(false)}>
                  Cancel
                </button>
                <button className="btn md" disabled={f.name.trim().length < 2} onClick={add}>
                  Create login
                </button>
              </>
            )
          }
        >
          {made ? (
            <>
              <CredBox rows={[["User ID", made.login_id], ["Password", made.password]]} />
              <p className="hint">The password is shown only now.</p>
            </>
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
      ) : null}
    </section>
  );
}
