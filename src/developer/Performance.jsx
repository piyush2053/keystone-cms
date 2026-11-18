import { useState } from "react";
import { useApi } from "../api";
import { AvA, BarIn, DayBars, ErrorNote, Funnel, Icon, Loading, Locked2, Seg, fmtTalk, num, pct } from "../lib";

const kraChip = (ok) =>
  ok ? (
    <span className="okc">
      <Icon n="check" s={12} />
      On track
    </span>
  ) : (
    <span className="flagc">
      <Icon n="flag" s={12} />
      Below target
    </span>
  );

export default function DevPerformance() {
  const [pf, setPf] = useState("all"),
    [rg, setRg] = useState("today");
  const qs = `range=${rg}&project_id=${pf}`;
  const { data, error, reload } = useApi("developer", "/developer/performance?" + qs, [qs]);
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  if (data.empty && !data.projects.length)
    return (
      <>
        <div className="page-h">
          <div>
            <p className="eyebrow">Performance</p>
            <h1>Nothing shared yet</h1>
          </div>
        </div>
        <Locked2 icon="chart" title="No performance data" text="Brokers decide whether you can see their numbers. Ask them to add you under Access to developer." />
      </>
    );
  const st = data.totals || { calls: 0, connected: 0, talk: 0, moves: { vp: 0, vc: 0, walkin: 0 } };
  const top = data.agents?.[0],
    slow = data.agents?.length > 1 ? [...data.agents].sort((x, y) => x.stats.calls - y.stats.calls)[0] : null;
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Performance summary · view only</p>
          <h1>{pf === "all" ? "All shared mandates" : data.projects.find((p) => p.id === pf)?.name}</h1>
        </div>
        <div className="acts">
          <select className="select" aria-label="Project" value={pf} onChange={(e) => setPf(e.target.value)}>
            <option value="all">All projects</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Seg
            opts={[
              ["today", "Today"],
              ["yesterday", "Yesterday"],
              ["week", "Last 7 days"],
            ]}
            val={rg}
            set={setRg}
          />
        </div>
      </div>
      {data.empty ? (
        <p className="empty-w">No mandates on this project are shared with you.</p>
      ) : (
        <>
          <div className="kpis-w">
            <div className="kpi dark">
              <small>Calls</small>
              <b>{num(st.calls)}</b>
              <span>
                {data.agents.length} agents · {data.brokers.length} brokers
              </span>
            </div>
            <div className="kpi">
              <small>Connect rate</small>
              <b>{pct(st.connected, st.calls)}%</b>
              <span>{num(st.connected)} conversations</span>
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
              <span>Clients at the site</span>
            </div>
          </div>
          <div className="g2" style={{ marginBottom: 16 }}>
            <section className="panel">
              <div className="panel-h">
                <div>
                  <p className="eyebrow">Key KRAs</p>
                  <h2>Against the targets you track</h2>
                </div>
              </div>
              <div className="summ">
                {data.kras.map((k) => (
                  <div key={k.k}>
                    <span>
                      {k.label} · target {num(k.goal)}
                      {k.unit || ""}
                    </span>
                    <b style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {num(k.value)}
                      {k.unit || ""} {kraChip(k.ok)}
                    </b>
                  </div>
                ))}
              </div>
              <div className="flabel" style={{ marginTop: 20 }}>
                Visits confirmed per day, last 7 days
              </div>
              <DayBars days={data.days} field="vc" label="Visits confirmed" />
            </section>
            <section className="panel">
              <div className="panel-h">
                <div>
                  <p className="eyebrow">Highlights</p>
                  <h2>{rg === "today" ? "Today" : rg === "yesterday" ? "Yesterday" : "This week"}</h2>
                </div>
              </div>
              {top ? (
                <div className="flagrow">
                  <span className="okc">
                    <Icon n="crown" s={12} />
                    Top
                  </span>
                  <div className="fx">
                    <b>
                      {top.name} · {top.broker}
                    </b>
                    <p>
                      {top.stats.calls} calls · {top.stats.moves.vp + top.stats.moves.vc} visits set · {top.stats.moves.walkin} walk-ins
                    </p>
                  </div>
                </div>
              ) : null}
              {slow && slow.id !== top?.id ? (
                <div className="flagrow">
                  <span className="flagc">
                    <Icon n="flag" s={12} />
                    Watch
                  </span>
                  <div className="fx">
                    <b>
                      {slow.name} · {slow.broker}
                    </b>
                    <p>{slow.stats.calls} calls, the lowest on your projects</p>
                  </div>
                </div>
              ) : null}
              <div className="flabel">Funnel, all time</div>
              <Funnel f={data.funnel} />
            </section>
          </div>
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Brokers</p>
                <h2>How each broker is doing</h2>
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Broker</th>
                    <th className="num">Agents</th>
                    <th>Calls vs target</th>
                    <th className="num">Connect</th>
                    <th className="num">Talk</th>
                    <th className="num">VP</th>
                    <th className="num">VC</th>
                    <th className="num">Walk-ins</th>
                  </tr>
                </thead>
                <tbody>
                  {data.brokers.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.broker}</b>
                      </td>
                      <td className="num">{r.agents}</td>
                      <td>
                        <BarIn v={r.stats.calls} max={r.target} label={r.stats.calls + " / " + r.target} />
                      </td>
                      <td className="num">{pct(r.stats.connected, r.stats.calls)}%</td>
                      <td className="num">{fmtTalk(r.stats.talk)}</td>
                      <td className="num">{r.stats.moves.vp}</td>
                      <td className="num">{r.stats.moves.vc}</td>
                      <td className="num">{r.stats.moves.walkin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Agents</p>
                <h2>All agents on your projects</h2>
              </div>
              <span className="hint">Agent names only. No client data.</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Broker</th>
                    <th>Calls vs target</th>
                    <th className="num">Connect</th>
                    <th className="num">Talk</th>
                    <th className="num">Visits set</th>
                    <th className="num">Walk-ins</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="who">
                          <AvA name={r.name} />
                          <b>{r.name}</b>
                        </div>
                      </td>
                      <td>{r.broker}</td>
                      <td>
                        <BarIn v={r.stats.calls} max={r.target} label={r.stats.calls + " / " + r.target} tone={pct(r.stats.calls, r.target) >= 60 ? "" : "warn"} />
                      </td>
                      <td className="num">{pct(r.stats.connected, r.stats.calls)}%</td>
                      <td className="num">{fmtTalk(r.stats.talk)}</td>
                      <td className="num">{r.stats.moves.vp + r.stats.moves.vc}</td>
                      <td className="num">{r.stats.moves.walkin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
