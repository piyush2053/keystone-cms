import { useState } from "react";
import { api, bump, useApi } from "../api";
import { AvA, ErrorNote, Icon, Loading, Locked2, toast, toastError } from "../lib";
import LeadUploader, { uploadPayload } from "./LeadUploader";
import { CreateAgentModal } from "./Agents";

const CFGS = ["1 BHK", "2 BHK", "2.5 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse", "Villa", "Plot", "Shop / Office"];
const DOCS = ["Brochure", "Floor plans", "Price sheet", "Walkthrough video", "Location map"];
const emptyProject = { name: "", developer_id: "", developer_name: "", locality: "", city: "Mumbai", configurations: [], price_from: "", budget: "", possession: "", tag: "New launch", carpet: "", description: "", documents: DOCS.map((t) => ({ title: t, url: "" })) };

export default function CreateMandate({ go }) {
  const opts = useApi("broker", "/broker/projects/options");
  const [step, setStep] = useState(0),
    [pid, setPid] = useState(null),
    [f, setF] = useState(emptyProject),
    [sel, setSel] = useState(new Set()),
    [data, setData] = useState(null),
    [busy, setBusy] = useState(false),
    [newAgent, setNewAgent] = useState(false);
  if (!opts.data) return opts.error ? <ErrorNote error={opts.error} retry={opts.reload} /> : <Loading />;
  const o = opts.data,
    plan = o.plan,
    live = o.usage.mandates;
  if (live >= plan.mandates)
    return (
      <>
        <div className="page-h">
          <div>
            <p className="eyebrow">Create mandate</p>
            <h1>Mandate limit reached</h1>
          </div>
        </div>
        <Locked2 title={`Your ${plan.name} plan allows ${plan.mandates} live mandate${plan.mandates > 1 ? "s" : ""}`} text={`You have ${live} live. Upgrade, or close a mandate you’ve finished.`} cta="See plans" onCta={() => go("profile", "plan")} />
      </>
    );
  const set = (k, v) => setF({ ...f, [k]: v });
  const picked = pid ? o.projects.find((p) => p.id === pid) : null;
  const available = o.projects.filter((p) => !p.has_live_mandate);
  const chosen = o.agents.filter((a) => sel.has(a.id));
  const devName = f.developer_id ? o.developers.find((d) => d.id === f.developer_id)?.company : f.developer_name;
  const ok0 = picked || (f.name.trim().length >= 2 && f.locality && (f.developer_id || f.developer_name.trim()));
  const ok1 = chosen.length > 0;
  const n = data ? data.rows.filter((x) => !x.issue).length : 0;
  const goLive = async () => {
    setBusy(true);
    try {
      const project = picked
        ? undefined
        : {
            ...f,
            developer_id: f.developer_id || null,
            documents: f.documents.filter((d) => d.url.trim()),
          };
      const body = { ...(picked ? { project_id: picked.id } : { project }), agent_ids: [...sel], ...(data ? uploadPayload(data, chosen) : {}) };
      const r = await api("broker", "/broker/mandates", { body });
      const name = picked ? picked.name : f.name.trim();
      toast({ title: name + " is live", line: r.leads ? `${r.leads.added} leads uploaded${r.leads.pooled ? ", " + r.leads.pooled + " in the shared pool" : ""}. Agents see them now.` : "Upload leads any time from Current mandates.", tone: "ok", icon: "briefcase" });
      bump();
      go("mandates", r.id);
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  };
  const STEPS = ["Project", "Agents", "Lead data", "Review"];
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Create mandate</p>
          <h1>Add a new project</h1>
          <p className="sub">
            {live} of {plan.mandates} live mandates on your {plan.name} plan
          </p>
        </div>
      </div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s} className={"step" + (i === step ? " on" : i < step ? " done" : "")}>
            <i>{i < step ? "✓" : i + 1}</i>
            {s}
          </div>
        ))}
      </div>
      <section className="panel">
        {step === 0 ? (
          <>
            {available.length ? (
              <>
                <div className="flabel" style={{ marginTop: 0 }}>
                  Pick a project already on Keystone
                </div>
                <div className="wrapchips" style={{ marginBottom: 18 }}>
                  {available.map((p) => (
                    <button key={p.id} className={"chip" + (pid === p.id ? " on" : "")} onClick={() => setPid(pid === p.id ? null : p.id)}>
                      {p.name} · {p.developer || p.locality}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {picked ? (
              <div className="summ">
                <div>
                  <span>Project</span>
                  <b>{picked.name}</b>
                </div>
                <div>
                  <span>Developer</span>
                  <b>{picked.developer || "—"}</b>
                </div>
                <div>
                  <span>Location</span>
                  <b>
                    {picked.locality}
                    {picked.city ? ", " + picked.city : ""}
                  </b>
                </div>
                <div>
                  <span>Homes</span>
                  <b>{picked.configurations.join(", ") || "—"}</b>
                </div>
                <div>
                  <span>Price from</span>
                  <b>{picked.price_from || "—"}</b>
                </div>
                <div>
                  <span>Possession</span>
                  <b>{picked.possession || "—"}</b>
                </div>
              </div>
            ) : (
              <>
                <div className="flabel" style={{ marginTop: 0 }}>
                  {available.length ? "Or describe a new project" : "Project details"}
                </div>
                <div className="wform">
                  <div className="wfield">
                    <label htmlFor="m-name">Project name</label>
                    <input className="winput" id="m-name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sterling One" />
                  </div>
                  <div className="wfield">
                    <label htmlFor="m-dev">Developer</label>
                    <select className="select" id="m-dev" value={f.developer_id || (f.developer_name ? "new" : "")} onChange={(e) => setF({ ...f, developer_id: e.target.value === "new" ? "" : e.target.value, developer_name: e.target.value === "new" ? f.developer_name || " " : "" })}>
                      <option value="">Choose developer</option>
                      {o.developers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.company}
                        </option>
                      ))}
                      <option value="new">New developer…</option>
                    </select>
                    {!f.developer_id && f.developer_name ? <input className="winput" style={{ marginTop: 8 }} value={f.developer_name.trimStart()} onChange={(e) => set("developer_name", e.target.value)} placeholder="Developer company name" /> : null}
                  </div>
                  <div className="wfield">
                    <label htmlFor="m-loc">Micro-market</label>
                    <select className="select" id="m-loc" value={f.locality} onChange={(e) => setF({ ...f, locality: e.target.value, city: o.localities.find((l) => l.name === e.target.value)?.city || f.city })}>
                      <option value="">Choose locality</option>
                      {o.localities.map((l) => (
                        <option key={l.name} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="wfield">
                    <label htmlFor="m-tag">Stage</label>
                    <select className="select" id="m-tag" value={f.tag} onChange={(e) => set("tag", e.target.value)}>
                      {["Pre-launch", "New launch", "Launch offer", "Under construction", "Ready to move"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <div className="wfield">
                    <label htmlFor="m-from">Price from</label>
                    <input className="winput" id="m-from" value={f.price_from} onChange={(e) => set("price_from", e.target.value)} placeholder="e.g. ₹1.95 Cr" />
                  </div>
                  <div className="wfield">
                    <label htmlFor="m-budget">Budget range</label>
                    <input className="winput" id="m-budget" value={f.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. ₹1.9–3 Cr" />
                  </div>
                  <div className="wfield">
                    <label htmlFor="m-poss">Possession</label>
                    <input className="winput" id="m-poss" value={f.possession} onChange={(e) => set("possession", e.target.value)} placeholder="e.g. Mar 2030" />
                  </div>
                  <div className="wfield">
                    <label htmlFor="m-carpet">Carpet area</label>
                    <input className="winput" id="m-carpet" value={f.carpet} onChange={(e) => set("carpet", e.target.value)} placeholder="e.g. 760–1,210 sq ft" />
                  </div>
                  <div className="wfield full">
                    <label>Configurations</label>
                    <div className="wrapchips">
                      {CFGS.map((x) => {
                        const on = f.configurations.includes(x);
                        return (
                          <button key={x} className={"chip" + (on ? " on" : "")} onClick={() => set("configurations", on ? f.configurations.filter((y) => y !== x) : [...f.configurations, x])}>
                            {x}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="wfield full">
                    <label htmlFor="m-desc">Pitch notes for agents</label>
                    <textarea className="winput" id="m-desc" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What agents should say first: location, offers, amenities" />
                  </div>
                </div>
                <div className="flabel">Files agents can share (links)</div>
                <p className="hint" style={{ marginTop: 0 }}>
                  Agents send these from their phone over WhatsApp. Paste a link to each file (Google Drive, Dropbox, the developer’s site).
                </p>
                {f.documents.map((d, i) => (
                  <div className="docrow" key={i}>
                    <input className="winput" value={d.title} onChange={(e) => set("documents", f.documents.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                    <input className="winput" placeholder="https://…" value={d.url} onChange={(e) => set("documents", f.documents.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                    <button className="iconbtn sm" aria-label="Remove file" onClick={() => set("documents", f.documents.filter((_, j) => j !== i))}>
                      <Icon n="x" s={15} />
                    </button>
                  </div>
                ))}
                <button className="link" style={{ fontSize: 13 }} onClick={() => set("documents", [...f.documents, { title: "", url: "" }])}>
                  + Add a file
                </button>
              </>
            )}
          </>
        ) : null}
        {step === 1 ? (
          <>
            <div className="panel-h" style={{ marginBottom: 10 }}>
              <div>
                <h2>Who calls this project?</h2>
                <p className="sub">Picked agents see its leads in their app as soon as it goes live.</p>
              </div>
              <button className="btn sm line" onClick={() => setNewAgent(true)}>
                <Icon n="plus" s={15} />
                Create new agent
              </button>
            </div>
            {o.agents.length ? (
              <div className="pickgrid">
                {o.agents.map((a) => {
                  const on = sel.has(a.id);
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
                        <small className="mono">{a.login_id}</small>
                      </div>
                      <span className={"check" + (on ? " on" : "")}>
                        <Icon n="check" s={12} w={2.4} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="empty-w">You have no agents yet. Create one to continue.</p>
            )}
          </>
        ) : null}
        {step === 2 ? <LeadUploader agents={chosen} data={data} setData={setData} /> : null}
        {step === 3 ? (
          <div className="g2e">
            <div>
              <div className="flabel" style={{ marginTop: 0 }}>
                Project
              </div>
              <div className="summ">
                <div>
                  <span>Project</span>
                  <b>{picked ? picked.name : f.name}</b>
                </div>
                <div>
                  <span>Developer</span>
                  <b>{picked ? picked.developer : devName}</b>
                </div>
                <div>
                  <span>Micro-market</span>
                  <b>{picked ? picked.locality : f.locality}</b>
                </div>
                <div>
                  <span>Configurations</span>
                  <b>{(picked ? picked.configurations : f.configurations).join(", ") || "—"}</b>
                </div>
                <div>
                  <span>Price from</span>
                  <b>{(picked ? picked.price_from : f.price_from) || "—"}</b>
                </div>
              </div>
            </div>
            <div>
              <div className="flabel" style={{ marginTop: 0 }}>
                Agents and data
              </div>
              <div className="summ">
                <div>
                  <span>Agents</span>
                  <b>{chosen.map((a) => a.name).join(", ")}</b>
                </div>
                <div>
                  <span>Leads to upload</span>
                  <b>{n}</b>
                </div>
                <div>
                  <span>Assignment</span>
                  <b>{!data ? "Upload later" : data.mode === "column" ? "By Agent column" : data.mode === "split" ? "Split evenly" : "All in shared pool"}</b>
                </div>
              </div>
              <div className="callout">
                <Icon n="info" s={16} />
                <span>Agents see this mandate in their app the moment it goes live. Shared-pool leads appear in every agent’s Fresh bucket and lock to whoever acts first.</span>
              </div>
            </div>
          </div>
        ) : null}
        <div className="wizard-f">
          <button className="btn md line" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <Icon n="chevL" s={16} />
            Back
          </button>
          {step < 3 ? (
            <button className="btn md" disabled={(step === 0 && !ok0) || (step === 1 && !ok1)} onClick={() => setStep(step + 1)}>
              {step === 2 && !n ? "Skip for now" : "Continue"}
              <Icon n="chevR" s={16} />
            </button>
          ) : (
            <button className="btn md gold" disabled={busy} onClick={goLive}>
              <Icon n="bolt" s={16} />
              Go live
            </button>
          )}
        </div>
      </section>
      {newAgent ? (
        <CreateAgentModal
          onClose={() => setNewAgent(false)}
          onCreated={(a) => {
            opts.reload();
            setSel(new Set([...sel, a.id]));
          }}
        />
      ) : null}
    </>
  );
}
