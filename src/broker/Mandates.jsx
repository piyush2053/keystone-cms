import { useEffect, useState } from "react";
import { api, bump, useApi } from "../api";
import { Art, AvA, BUCKETS, Confirm, Drawer, ErrorNote, Icon, LeadJourney, Loading, Locked2, Modal, Pill, ago, firstName, fmtDate, rowMeta, toast, toastError } from "../lib";
import LeadUploader, { uploadPayload } from "./LeadUploader";

export default function Mandates({ sub, go }) {
  const list = useApi("broker", "/broker/mandates");
  const ms = list.data || [];
  const mid = ms.find((m) => m.id === sub)?.id || ms[0]?.id;
  if (!list.data) return list.error ? <ErrorNote error={list.error} retry={list.reload} /> : <Loading />;
  if (!mid)
    return (
      <>
        <div className="page-h">
          <div>
            <p className="eyebrow">Current mandates</p>
            <h1>No live mandates</h1>
          </div>
        </div>
        <Locked2 icon="briefcase" title="Start your first mandate" text="Add a project, pick agents and upload lead data." cta="Create mandate" onCta={() => go("create")} />
      </>
    );
  return <MandateView key={mid} mid={mid} ms={ms} go={go} />;
}

function MandateView({ mid, ms, go }) {
  const m = useApi("broker", "/broker/mandates/" + mid);
  const team = useApi("broker", "/broker/agents");
  const [bf, setBf] = useState("all"),
    [af, setAf] = useState("all"),
    [q, setQ] = useState(""),
    [qd, setQd] = useState(""),
    [page, setPage] = useState(1),
    [sel, setSel] = useState(new Set()),
    [allMatching, setAllMatching] = useState(false),
    [to, setTo] = useState(""),
    [restart, setRestart] = useState(true),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(null),
    [lead, setLead] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => setQd(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const filter = { bucket: bf, agent: af, q: qd };
  const qs = new URLSearchParams({ ...filter, page }).toString();
  const leads = useApi("broker", `/broker/mandates/${mid}/leads?${qs}`, [qs]);
  const clearSel = () => {
    setSel(new Set());
    setAllMatching(false);
  };
  useEffect(clearSel, [bf, af, qd]);
  if (!m.data) return m.error ? <ErrorNote error={m.error} retry={m.reload} /> : <Loading />;
  const d = m.data,
    p = d.project,
    items = leads.data?.items || [],
    total = leads.data?.total || 0;
  const allTotal = Object.values(d.counts).reduce((s, n) => s + n, 0);
  const poolTotal = Object.values(d.pool).reduce((s, n) => s + n, 0);
  const pageSel = items.length > 0 && items.every((l) => sel.has(l.id));
  const nSel = allMatching ? total : sel.size;
  const active = (team.data?.items || []).filter((a) => a.active);
  const toggle = (id) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
    setAllMatching(false);
  };
  const transfer = async () => {
    setBusy(true);
    try {
      const r = await api("broker", "/broker/leads/transfer", {
        body: { mandate_id: mid, ...(allMatching ? { filter } : { lead_ids: [...sel] }), to_agent_id: to === "pool" ? null : to, as_fresh: restart },
      });
      toast({ title: `Moved ${r.transferred} lead${r.transferred === 1 ? "" : "s"} to ${r.to}`, line: restart ? "Restarted in Fresh for a new churn" : "Kept in their current buckets", tone: "ok", icon: "transfer" });
      clearSel();
      setTo("");
      bump();
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  };
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Current mandates</p>
          <h1>{p.name}</h1>
        </div>
        <div className="acts">
          <button className="btn md line" onClick={() => setModal("upload")}>
            <Icon n="upload" s={16} />
            Upload more leads
          </button>
          <button className="btn md line" onClick={() => setModal("agents")}>
            <Icon n="users" s={16} />
            Manage agents
          </button>
          <button className="btn md line" onClick={() => setModal("close")} title="Stop calling on this project">
            <Icon n="lock" s={16} />
            Close
          </button>
        </div>
      </div>
      <div className="mtabs" role="tablist">
        {ms.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === mid} className={"mtab" + (x.id === mid ? " on" : "")} onClick={() => go("mandates", x.id)}>
            <Art id={x.project_id} locality={x.locality} />
            <div>
              <b>{x.project}</b>
              <small>
                {x.total} leads · {x.agents.filter((a) => a.active).length} agents
              </small>
            </div>
          </button>
        ))}
      </div>
      <section className="panel">
        <div className="mhead">
          <Art id={p.id} locality={p.locality} />
          <div className="mt">
            <h2>{p.name}</h2>
            <p className="sub">
              {p.locality} · {p.developer || "Developer"} · live since {fmtDate(d.created_at, true)}
            </p>
          </div>
          <div className="avstack">
            {d.agents
              .filter((a) => a.active && !a.off_mandate)
              .map((a) => (
                <AvA key={a.id} name={a.name} />
              ))}
          </div>
        </div>
        <div className="bfilters">
          {[{ id: "all", label: "All leads", n: allTotal, c: "#24395A" }, ...BUCKETS.map((b) => ({ id: b.id, label: b.label, n: d.counts[b.id], c: b.c }))].map((x) => (
            <button
              key={x.id}
              className={"bf" + (bf === x.id ? " on" : "")}
              style={{ "--c": x.c }}
              onClick={() => {
                setBf(x.id);
                setPage(1);
              }}
            >
              <b>{x.n}</b>
              <span>
                <i />
                {x.label}
              </span>
            </button>
          ))}
        </div>
        <div className="ctrls-row">
          <select
            className="select"
            aria-label="Agent"
            value={af}
            onChange={(e) => {
              setAf(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All agents</option>
            <option value="pool">Shared pool ({poolTotal})</option>
            {d.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {!a.active ? " (removed)" : a.off_mandate ? " (off mandate)" : ""} · {Object.values(a.counts).reduce((s, n) => s + n, 0)}
              </option>
            ))}
          </select>
          <div className="search-w">
            <Icon n="search" s={16} />
            <input
              placeholder="Search name or last 4 digits"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <span className="hint" style={{ marginLeft: "auto" }}>
            {total} lead{total === 1 ? "" : "s"}
            {nSel ? " · " + nSel + " selected" : ""}
          </span>
        </div>
        {pageSel && total > items.length && !allMatching ? (
          <div className="callout" style={{ margin: "0 0 10px" }}>
            <Icon n="info" s={16} />
            <span>
              All {items.length} on this page are selected.{" "}
              <button className="link" onClick={() => setAllMatching(true)}>
                Select all {total} matching leads
              </button>
            </span>
          </div>
        ) : null}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <button className={"check" + (pageSel || allMatching ? " on" : "")} onClick={() => (pageSel || allMatching ? clearSel() : setSel(new Set(items.map((l) => l.id))))} aria-label="Select all leads on this page">
                    <Icon n="check" s={12} w={2.4} />
                  </button>
                </th>
                <th>Lead</th>
                <th>Mobile</th>
                <th>Agent</th>
                <th>Bucket</th>
                <th>Status</th>
                <th className="num">Dials</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => {
                const on = allMatching || sel.has(l.id),
                  rm = rowMeta(l);
                return (
                  <tr key={l.id} className={"click" + (on ? " sel" : "")} onClick={() => setLead(l.id)}>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(l.id);
                      }}
                    >
                      <button className={"check" + (on ? " on" : "")} aria-label={"Select " + l.name}>
                        <Icon n="check" s={12} w={2.4} />
                      </button>
                    </td>
                    <td>
                      <div className="who">
                        <div>
                          <b>{l.name}</b>
                          <small>
                            {l.source}
                            {l.with_tl ? " · with you" : ""}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{l.phone}</td>
                    <td>
                      {l.agent_name || (
                        <span className="tag pool" style={{ margin: 0 }}>
                          Pool
                        </span>
                      )}
                    </td>
                    <td>
                      <Pill b={l.bucket} />
                    </td>
                    <td>
                      <span className={"meta " + rm.tone}>{rm.text}</span>
                    </td>
                    <td className="num">{l.call_count}</td>
                    <td className="muted">{ago(l.last_call_at || l.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!items.length && !leads.loading ? <p className="empty-w">No leads match these filters.</p> : null}
        {total > 100 ? (
          <div className="pager">
            <span>
              Page {page} of {Math.ceil(total / 100)}
            </span>
            <span style={{ display: "flex", gap: 8 }}>
              <button className="btn sm line" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <Icon n="chevL" s={14} />
                Previous
              </button>
              <button className="btn sm line" disabled={page * 100 >= total} onClick={() => setPage(page + 1)}>
                Next
                <Icon n="chevR" s={14} />
              </button>
            </span>
          </div>
        ) : null}
      </section>
      {nSel ? (
        <div className="bulk">
          <b>{nSel} selected</b>
          <span>Transfer to</span>
          <select className="select" aria-label="Transfer to" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Choose agent</option>
            <option value="pool">Shared pool</option>
            {active.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {d.agents.some((x) => x.id === a.id && !x.off_mandate) ? "" : " (adds to mandate)"}
              </option>
            ))}
          </select>
          <label className="ck">
            <input type="checkbox" checked={restart} onChange={(e) => setRestart(e.target.checked)} />
            Restart in Fresh for a new churn
          </label>
          <span className="grow" />
          <button className="btn sm ghost" style={{ color: "var(--ivory)", borderColor: "rgba(247,244,237,.3)" }} onClick={clearSel}>
            Clear
          </button>
          <button className="btn sm gold" disabled={!to || busy} onClick={transfer}>
            <Icon n="transfer" s={15} />
            Transfer {nSel}
          </button>
        </div>
      ) : null}
      {lead ? <LeadDrawer id={lead} mid={mid} agents={active} onClose={() => setLead(null)} /> : null}
      {modal === "upload" ? <AddLeadsModal d={d} onClose={() => setModal(null)} /> : null}
      {modal === "agents" ? <MandateAgentsModal d={d} team={active} onClose={() => setModal(null)} /> : null}
      {modal === "close" ? (
        <Confirm
          title={`Close ${p.name}?`}
          sub="Agents stop seeing its leads at once. Numbers and history are kept, and you can reopen it later."
          action="Close mandate"
          danger
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api("broker", `/broker/mandates/${mid}/close`, { body: {} });
            toast({ title: p.name + " closed", icon: "lock" });
            bump();
            go("mandates");
          }}
        />
      ) : null}
    </>
  );
}

function LeadDrawer({ id, mid, agents, onClose }) {
  const { data: l } = useApi("broker", "/broker/leads/" + id, [id]);
  const [to, setTo] = useState("");
  if (!l) return null;
  const others = agents.filter((a) => a.id !== l.agent_id);
  const move = async () => {
    try {
      const r = await api("broker", "/broker/leads/transfer", { body: { mandate_id: mid, lead_ids: [l.id], to_agent_id: to === "pool" ? null : to, as_fresh: false } });
      toast({ title: `${l.name} moved to ${r.to}`, line: r.to === "Pool" ? "Every agent on the mandate sees it in Fresh" : `It shows in ${firstName(r.to)}’s app right away`, tone: "ok", icon: "transfer" });
      setTo("");
      bump();
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <Drawer eyebrow={l.project + " · " + (l.agent_name || "Shared pool")} title={l.name} sub={l.phone + " · " + (l.source || "—")} onClose={onClose}>
      <div className="lpills" style={{ padding: "0 0 12px" }}>
        <Pill b={l.bucket} />
        {l.with_tl ? (
          <span className="pill" style={{ "--c": "#7F6131" }}>
            With you for closing
          </span>
        ) : null}
        {!l.agent_id ? (
          <span className="pill" style={{ "--c": "#4A6FA5" }}>
            Shared pool
          </span>
        ) : null}
      </div>
      <div className="facts">
        <div>
          <span>Project</span>
          <b>{l.project}</b>
        </div>
        <div>
          <span>Status</span>
          <b>{rowMeta(l).text || "—"}</b>
        </div>
        <div>
          <span>Configuration</span>
          <b>{l.configuration || "—"}</b>
        </div>
        <div>
          <span>Budget</span>
          <b>{l.budget || "—"}</b>
        </div>
      </div>
      <div className="flabel">Move to another agent</div>
      <div style={{ display: "flex", gap: 8 }}>
        <select className="select" style={{ flex: 1 }} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Choose agent</option>
          {l.agent_id ? <option value="pool">Shared pool</option> : null}
          {others.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button className="btn sm" disabled={!to} onClick={move}>
          Move
        </button>
      </div>
      <div className="flabel" style={{ marginTop: 22 }}>
        Lead journey
      </div>
      <LeadJourney events={l.journey} />
    </Drawer>
  );
}

function AddLeadsModal({ d, onClose }) {
  const agents = d.agents.filter((a) => a.active && !a.off_mandate);
  const [data, setData] = useState(null),
    [busy, setBusy] = useState(false);
  const n = data ? data.rows.filter((x) => !x.issue).length : 0;
  const add = async () => {
    setBusy(true);
    try {
      const r = await api("broker", `/broker/mandates/${d.id}/leads`, { body: uploadPayload(data, agents) });
      toast({
        title: `${r.added} leads added to ${d.project.name}`,
        line: [r.pooled ? r.pooled + " in the shared pool" : null, r.duplicates ? r.duplicates + " already in this mandate" : null].filter(Boolean).join(" · ") || "Agents see them in Fresh now",
        tone: "ok",
        icon: "upload",
      });
      bump();
      onClose();
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  };
  return (
    <Modal
      wide
      eyebrow="Upload more leads"
      title={d.project.name}
      sub={"Agents on this mandate: " + (agents.map((a) => a.name).join(", ") || "none yet")}
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn md" disabled={!n || busy} onClick={add}>
            Add {n || ""} leads
          </button>
        </>
      }
    >
      <LeadUploader agents={agents} data={data} setData={setData} />
    </Modal>
  );
}

function MandateAgentsModal({ d, team, onClose }) {
  const [sel, setSel] = useState(new Set(d.agents.filter((a) => a.active && !a.off_mandate).map((a) => a.id)));
  const [busy, setBusy] = useState(false);
  const leadsOf = (id) => Object.values(d.agents.find((a) => a.id === id)?.counts || {}).reduce((s, n) => s + n, 0);
  const save = async () => {
    setBusy(true);
    try {
      const r = await api("broker", `/broker/mandates/${d.id}/agents`, { method: "PUT", body: { agent_ids: [...sel] } });
      toast({ title: "Agents updated", line: r.returned_to_pool ? r.returned_to_pool + " open leads went back to the shared pool" : "Their apps update right away", tone: "ok", icon: "users" });
      bump();
      onClose();
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  };
  return (
    <Modal
      eyebrow="Manage agents"
      title={d.project.name}
      sub="Agents on a mandate see its leads in their app. Taking an agent off returns their open leads to the shared pool."
      onClose={onClose}
      foot={
        <>
          <button className="btn md line" onClick={onClose}>
            Cancel
          </button>
          <button className="btn md" disabled={busy} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="pickgrid">
        {team.map((a) => {
          const on = sel.has(a.id),
            n = leadsOf(a.id);
          return (
            <button
              key={a.id}
              className={"pick" + (on ? " on" : "")}
              onClick={() => {
                const s2 = new Set(sel);
                on ? s2.delete(a.id) : s2.add(a.id);
                setSel(s2);
              }}
            >
              <AvA name={a.name} />
              <div style={{ minWidth: 0 }}>
                <b>{a.name}</b>
                <small>{on ? (n ? n + " leads here" : "On this mandate") : n ? n + " leads go to the pool" : "Not on this mandate"}</small>
              </div>
              <span className={"check" + (on ? " on" : "")}>
                <Icon n="check" s={12} w={2.4} />
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
