import { useApi } from "../api";
import { Art, ErrorNote, Icon, Loading, Locked2, firstName, fmtDate, fmtLong, greetWord, num, pct } from "../lib";

const scopeLabel = (c) => (c.scope === "locality" ? c.locality + " and nearby" : c.scope === "state" ? "Maharashtra" : "All India");
export { scopeLabel };

export function DevHome({ me, go }) {
  const { data, error, reload } = useApi("developer", "/developer/home");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const t = data.totals,
    ms = data.mandates;
  const projects = [...new Map(ms.map((m) => [m.project_id, m])).values()];
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">{fmtLong(Date.now())}</p>
          <h1>
            {greetWord()}, {firstName(me.name)}
          </h1>
          <p className="sub">
            {ms.length} mandate{ms.length === 1 ? "" : "s"} shared by {data.brokers.length} broker{data.brokers.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="acts">
          <button className="btn md line" onClick={() => go("perf")}>
            <Icon n="chart" s={17} />
            Performance
          </button>
          <button className="btn md gold" onClick={() => go("campaigns", "new")}>
            <Icon n="megaphone" s={17} />
            Create campaign
          </button>
        </div>
      </div>
      {!ms.length ? (
        <Locked2 icon="briefcase" title="No broker has shared data yet" text="When a broker gives you view access, the daily performance of their mandates on your projects shows up here." />
      ) : (
        <>
          <div className="kpis-w">
            <div className="kpi dark">
              <small>Calls today</small>
              <b>{num(t.calls)}</b>
              <span>across {data.brokers.length} brokers</span>
            </div>
            <div className="kpi">
              <small>Connect rate</small>
              <b>{pct(t.connected, t.calls)}%</b>
              <span>{num(t.connected)} conversations</span>
            </div>
            <div className="kpi">
              <small>Site visits set today</small>
              <b>{t.moves.vp + t.moves.vc}</b>
              <span>{t.moves.vc} confirmed</span>
            </div>
            <div className="kpi">
              <small>Walk-ins today</small>
              <b>{t.moves.walkin}</b>
              <span>Clients at the site</span>
            </div>
            <div className="kpi">
              <small>Leads in play</small>
              <b>{num(ms.reduce((s, m) => s + Object.entries(m.counts).filter(([k]) => !["junk", "failed"].includes(k)).reduce((x, [, n]) => x + n, 0), 0))}</b>
              <span>of {num(ms.reduce((s, m) => s + Object.values(m.counts).reduce((x, n) => x + n, 0), 0))} uploaded</span>
            </div>
          </div>
          <div className="g2">
            <div className="stack">
              {projects.map((p) => {
                const pm = ms.filter((m) => m.project_id === p.project_id);
                return (
                  <section className="panel" key={p.project_id}>
                    <div className="mhead">
                      <Art id={p.project_id} locality={p.locality} />
                      <div className="mt">
                        <p className="eyebrow">Shared mandate</p>
                        <h2>{p.project}</h2>
                        <p className="sub">
                          {p.locality} · {pm.length} broker{pm.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="tbl-wrap" style={{ marginTop: 14 }}>
                      <table className="tbl" style={{ minWidth: 520 }}>
                        <thead>
                          <tr>
                            <th>Broker</th>
                            <th className="num">Agents</th>
                            <th className="num">Calls today</th>
                            <th className="num">Visits lined up</th>
                            <th className="num">Walk-ins</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pm.map((m) => (
                            <tr key={m.id}>
                              <td>
                                <b>{m.broker}</b>
                              </td>
                              <td className="num">{m.agents}</td>
                              <td className="num">{m.today.calls}</td>
                              <td className="num">{m.counts.vp + m.counts.vc}</td>
                              <td className="num">{m.counts.walkin}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="stack">
              <section className="panel">
                <div className="panel-h">
                  <div>
                    <p className="eyebrow">Brokers today</p>
                    <h2>Who’s moving your projects</h2>
                  </div>
                </div>
                {data.brokers.map((b, i) => (
                  <div className="flagrow" key={b.broker}>
                    <span className="av-sq" style={{ background: "var(--navy)" }}>
                      {i + 1}
                    </span>
                    <div className="fx">
                      <b>{b.broker}</b>
                      <p>
                        {b.calls} calls · {b.visits} visits set · {b.walkins} walk-ins
                      </p>
                    </div>
                  </div>
                ))}
              </section>
              <section className="panel">
                <div className="panel-h">
                  <div>
                    <p className="eyebrow">Campaigns</p>
                    <h2>{data.live_campaigns} live</h2>
                  </div>
                  <button className="link" onClick={() => go("campaigns")}>
                    All campaigns
                  </button>
                </div>
                {data.campaigns.length ? (
                  data.campaigns.map((c) => (
                    <div className="flagrow" key={c.id}>
                      <span className="av-sq" style={{ background: "var(--navy)" }}>
                        <Icon n="megaphone" s={15} />
                      </span>
                      <div className="fx">
                        <b>{c.project}</b>
                        <p>
                          {scopeLabel(c)} · {num(c.accepted)} brokers participating · {c.payment_status === "pending" ? "Payment pending" : c.live ? c.days_left + " days left" : "Ended"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-w">No campaigns yet.</p>
                )}
              </section>
              <div className="callout" style={{ margin: 0 }}>
                <Icon n="shield" s={16} />
                <span>You see performance numbers only. Client names and phone numbers stay with the broker.</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function DevMandates() {
  const { data, error, reload } = useApi("developer", "/developer/mandates");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const projects = [...new Map(data.map((m) => [m.project_id, m])).values()];
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">Current mandates</p>
          <h1>Shared with you</h1>
          <p className="sub">Brokers who give you access share every mandate they run on your projects. Pipeline counts only.</p>
        </div>
      </div>
      {!data.length ? (
        <Locked2 icon="briefcase" title="Nothing shared yet" text="Ask your broker partners to add you under Access to developer in their Keystone profile." />
      ) : (
        projects.map((p) => {
          const pm = data.filter((m) => m.project_id === p.project_id),
            info = p.project_info || {};
          return (
            <section className="panel" key={p.project_id}>
              <div className="mhead">
                <Art id={p.project_id} locality={p.locality} />
                <div className="mt">
                  <h2>{p.project}</h2>
                  <p className="sub">
                    {[p.locality, (info.configurations || []).join(", "), info.price_from ? "from " + info.price_from : null, info.possession ? "possession " + info.possession : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="tbl-wrap" style={{ marginTop: 16 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Broker</th>
                      <th>Status</th>
                      <th className="num">Agents</th>
                      <th className="num">Leads</th>
                      <th className="num">Not yet reached</th>
                      <th className="num">In conversation</th>
                      <th className="num">Visits lined up</th>
                      <th className="num">Walk-ins</th>
                      <th className="num">Closed out</th>
                      <th>Live since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pm.map((m) => {
                      const c = m.counts;
                      return (
                        <tr key={m.id}>
                          <td>
                            <b>{m.broker}</b>
                          </td>
                          <td>{m.status === "live" ? <span className="okc">Live</span> : <span className="mutc">Closed</span>}</td>
                          <td className="num">{m.agents}</td>
                          <td className="num">{m.total}</td>
                          <td className="num">{c.fresh + c.rechurn}</td>
                          <td className="num">{c.followup + c.interested}</td>
                          <td className="num">{c.vp + c.vc}</td>
                          <td className="num">{c.walkin}</td>
                          <td className="num">{c.junk + c.failed}</td>
                          <td className="muted">{fmtDate(m.created_at, true)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
