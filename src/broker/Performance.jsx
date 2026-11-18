import { useState } from "react";
import { useApi } from "../api";
import { AvA, BarIn, DayBars, Drawer, ErrorNote, Funnel, Hours, Icon, Loading, Locked2, Seg, copyText, firstName, fmtTalk, num, pct } from "../lib";

const RANGES = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["week", "Last 7 days"],
];
const feedbackText = (a, flags, from) =>
  `Hi ${firstName(a.name)}, quick feedback on today:\n` + flags.map((f) => `• ${f.text} (${f.detail}). ${f.tip}`).join("\n") + `\nThanks. Ping me if anything is blocking you.\n— ${firstName(from)}`;

export default function Performance({ me, go }) {
  const [mf, setMf] = useState("all"),
    [rg, setRg] = useState("today"),
    [agent, setAgent] = useState(null);
  const qs = `range=${rg}${mf !== "all" ? "&mandate_id=" + mf : ""}`;
  const { data, error, reload } = useApi("broker", "/broker/performance?" + qs, [qs]);
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  if (data.locked)
    return (
      <>
        <div className="page-h">
          <div>
            <p className="eyebrow">Performance summary</p>
            <h1>Not on the Basic plan</h1>
          </div>
        </div>
        <Locked2 icon="chart" title="See how every agent is doing" text="Plus adds a mandate-wise summary for every agent. Pro adds the full lead funnel, red flags and ready-to-send feedback." cta="Compare plans" onCta={() => go("profile", "plan")} />
      </>
    );
  const adv = data.plan.perf === "advanced",
    st = data.totals,
    days = rg === "week" ? 7 : 1;
  const target = data.rows.reduce((s, r) => s + r.target, 0);
  const flags = data.rows.flatMap((r) => r.flags.map((f) => ({ a: r, f })));
  const mName = mf === "all" ? "All mandates" : data.mandates.find((m) => m.id === mf)?.name;
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Performance summary · {adv ? "Advanced" : "Basic"}</p>
          <h1>{mName}</h1>
        </div>
        <div className="acts">
          <select className="select" aria-label="Mandate" value={mf} onChange={(e) => setMf(e.target.value)}>
            <option value="all">All mandates</option>
            {data.mandates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Seg opts={RANGES} val={rg} set={setRg} />
        </div>
      </div>
      <div className="kpis-w">
        <div className="kpi dark">
          <small>Calls</small>
          <b>{num(st.calls)}</b>
          <span>
            {data.rows.length} agents · {pct(st.calls, target)}% of target
          </span>
        </div>
        <div className="kpi">
          <small>Connect rate</small>
          <b>{pct(st.connected, st.calls)}%</b>
          <span>
            {num(st.connected)} connected · {fmtTalk(st.talk)} talk
          </span>
        </div>
        <div className="kpi">
          <small>Visits proposed</small>
          <b>{st.moves.vp}</b>
          <span>Client suggested a date</span>
        </div>
        <div className="kpi">
          <small>Visits confirmed</small>
          <b>{st.moves.vc}</b>
          <span>Today or tomorrow</span>
        </div>
        <div className="kpi">
          <small>Walk-ins</small>
          <b>{st.moves.walkin}</b>
          <span>
            {st.moves.failed} failed · {st.moves.junk} junk
          </span>
        </div>
      </div>
      {adv ? (
        <div className="g2" style={{ marginBottom: 16 }}>
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Lead funnel</p>
                <h2>From upload to walk-in</h2>
              </div>
              <span className="hint">{num(data.funnel.assigned)} leads, all time</span>
            </div>
            <Funnel f={data.funnel} />
            <div className="flabel" style={{ marginTop: 22 }}>
              Visits confirmed per day
            </div>
            <DayBars days={data.days} field="vc" label="Visits confirmed" />
          </section>
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Red flags · today</p>
                <h2>{flags.length ? flags.length + " to talk about" : "Nothing to flag"}</h2>
              </div>
            </div>
            {flags.length ? (
              flags.map((x, i) => (
                <div className="flagrow" key={i}>
                  <AvA name={x.a.name} />
                  <div className="fx">
                    <b>
                      {x.a.name} · {x.f.text}
                    </b>
                    <p>{x.f.detail}</p>
                  </div>
                  <button className="btn sm line" onClick={() => setAgent(x.a.id)}>
                    Feedback
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-w">Every agent is on track.</p>
            )}
          </section>
        </div>
      ) : (
        <>
          <section className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-h">
              <div>
                <p className="eyebrow">Last 7 days</p>
                <h2>Calls per day</h2>
              </div>
            </div>
            <DayBars days={data.days} field="calls" label="Calls" />
          </section>
          <div className="callout" style={{ margin: "0 0 16px" }}>
            <Icon n="crown" s={16} />
            <span>
              You’re on Plus, which shows the basic summary. Pro adds the lead funnel, red flags and ready-to-send feedback.{" "}
              <button className="link" onClick={() => go("profile", "plan")}>
                Compare plans
              </button>
            </span>
          </div>
        </>
      )}
      <section className="panel">
        <div className="panel-h">
          <div>
            <p className="eyebrow">By agent</p>
            <h2>{rg === "today" ? "Today so far" : rg === "yesterday" ? "Yesterday" : "Last 7 days"}</h2>
          </div>
          <span className="hint">Click an agent for details{adv ? ", red flags and feedback" : ""}</span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Agent</th>
                <th className="num">Leads</th>
                <th>Calls vs target</th>
                <th className="num">Connect</th>
                <th className="num">Talk</th>
                <th className="num">Overdue</th>
                <th className="num">VP</th>
                <th className="num">VC</th>
                <th className="num">Walk-ins</th>
                {adv ? <th>Flags</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="click" onClick={() => setAgent(r.id)}>
                  <td>
                    <div className="who">
                      <AvA name={r.name} />
                      <div>
                        <b>{r.name}</b>
                        <small>{r.mandates.join(" · ") || "No mandate"}</small>
                      </div>
                    </div>
                  </td>
                  <td className="num">{r.leads}</td>
                  <td>
                    <BarIn v={r.stats.calls} max={r.target} label={r.stats.calls + " / " + r.target} tone={pct(r.stats.calls, r.target) >= 60 ? "" : "warn"} />
                  </td>
                  <td className="num">{pct(r.stats.connected, r.stats.calls)}%</td>
                  <td className="num">{fmtTalk(r.stats.talk)}</td>
                  <td className="num" style={r.overdue >= 3 ? { color: "var(--bad)", fontWeight: 600 } : undefined}>
                    {r.overdue}
                  </td>
                  <td className="num">{r.stats.moves.vp}</td>
                  <td className="num">{r.stats.moves.vc}</td>
                  <td className="num">{r.stats.moves.walkin}</td>
                  {adv ? (
                    <td>
                      {r.flags.length ? (
                        <span className="flagc">
                          <Icon n="flag" s={12} />
                          {r.flags.length} flag{r.flags.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="okc">
                          <Icon n="check" s={12} />
                          On track
                        </span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.rows.length ? <p className="empty-w">No agents on {mf === "all" ? "your mandates" : "this mandate"} yet.</p> : null}
      </section>
      {agent ? <AgentDrawer id={agent} mf={mf} rg={rg} days={days} me={me} onClose={() => setAgent(null)} /> : null}
    </>
  );
}

function AgentDrawer({ id, mf, rg, me, onClose }) {
  const qs = `range=${rg}${mf !== "all" ? "&mandate_id=" + mf : ""}`;
  const { data: d } = useApi("broker", `/broker/performance/agents/${id}?${qs}`, [id, qs]);
  if (!d) return null;
  const a = d.agent,
    s = d.stats,
    adv = d.plan.perf === "advanced";
  return (
    <Drawer eyebrow={`Signs in as ${a.login_id}`} title={a.name} sub={`Target ${a.daily_target} calls a day`} onClose={onClose}>
      <div className="kpis-w" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="kpi">
          <small>Calls</small>
          <b>{s.calls}</b>
        </div>
        <div className="kpi">
          <small>Connected</small>
          <b>{pct(s.connected, s.calls)}%</b>
        </div>
        <div className="kpi">
          <small>Visits set</small>
          <b>{s.moves.vp + s.moves.vc}</b>
        </div>
      </div>
      {adv ? (
        <>
          <div className="flabel">Red flags</div>
          {d.flags.length ? (
            <>
              {d.flags.map((f) => (
                <div className="flagrow" key={f.k}>
                  <span className="flagc">
                    <Icon n="flag" s={12} />
                  </span>
                  <div className="fx">
                    <b>{f.text}</b>
                    <p>{f.detail}</p>
                    <p style={{ color: "var(--ink)" }}>{f.tip}</p>
                  </div>
                </div>
              ))}
              <button className="btn md block" style={{ marginTop: 10 }} onClick={() => copyText(feedbackText(a, d.flags, me.owner_name), "Feedback copied · paste it into WhatsApp")}>
                <Icon n="copy" s={16} />
                Copy feedback for {firstName(a.name)}
              </button>
            </>
          ) : (
            <p className="hint">No red flags. {firstName(a.name)} is on track.</p>
          )}
        </>
      ) : null}
      <div className="flabel">Calls by hour, today</div>
      <Hours h={d.hours || []} />
      <div className="flabel">Calls per day</div>
      <DayBars days={d.days} field="calls" label="Calls" />
      {d.funnel ? (
        <>
          <div className="flabel">Lead funnel</div>
          <Funnel f={d.funnel} />
        </>
      ) : null}
    </Drawer>
  );
}
