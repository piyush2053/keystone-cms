import { useApi } from "../api";
import { Art, AvA, BarIn, ErrorNote, Icon, Loading, feedIcon, feedLine, feedTone, firstName, fmtLong, fmtTime, greetWord, num, pct } from "../lib";

const FLAG_TAG = { pace: "Pace", connect: "Connects", overdue: "Follow-ups", junk: "Data", idle: "Idle", untouched: "Fresh" };

export default function Home({ me, go }) {
  const { data, error, reload } = useApi("broker", "/broker/home");
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const t = data.totals;
  const target = data.agents.reduce((s, a) => s + a.daily_target, 0);
  const calling = data.agents.filter((a) => a.today.last_call && Date.now() - Date.parse(a.today.last_call) < 45 * 60000).length;
  const flags = data.agents.flatMap((a) => a.flags.map((f) => ({ a, f })));
  const adv = data.plan.perf === "advanced";
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">{fmtLong(Date.now())}</p>
          <h1>
            {greetWord()}, {firstName(me.owner_name)}
          </h1>
        </div>
        <div className="acts">
          <button className="btn md line" onClick={() => go("perf")}>
            <Icon n="chart" s={17} />
            Performance
          </button>
          <button className="btn md gold" onClick={() => go("create")}>
            <Icon n="plus" s={17} />
            Create mandate
          </button>
        </div>
      </div>
      <div className="kpis-w">
        <div className="kpi dark">
          <small>Calls today</small>
          <b>{num(t.calls)}</b>
          <span>
            Team target {num(target)} · {pct(t.calls, target)}% done
          </span>
        </div>
        <div className="kpi">
          <small>Connected</small>
          <b>{num(t.connected)}</b>
          <span>{pct(t.connected, t.calls)}% connect rate</span>
        </div>
        <div className="kpi">
          <small>Site visits set</small>
          <b>{t.moves.vp + t.moves.vc}</b>
          <span>{t.moves.vc} confirmed today</span>
        </div>
        <div className="kpi">
          <small>Walk-ins today</small>
          <b>{t.moves.walkin}</b>
          <span>{t.moves.failed} failed · {t.moves.junk} junk</span>
        </div>
        <div className="kpi">
          <small>Calling now</small>
          <b>{calling}</b>
          <span>of {data.agents.length} agents, last 45 min</span>
        </div>
      </div>
      <div className="g2">
        <div className="stack">
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Current mandates</p>
                <h2>
                  {data.mandates.length} live project{data.mandates.length === 1 ? "" : "s"}
                </h2>
              </div>
              <button className="link" onClick={() => go("mandates")}>
                Open mandates
              </button>
            </div>
            {data.mandates.length ? (
              <div className="stack" style={{ gap: 10 }}>
                {data.mandates.map((m) => (
                  <button className="mcard" key={m.id} onClick={() => go("mandates", m.id)}>
                    <Art id={m.project_id} locality={m.locality} />
                    <div className="mb">
                      <h3>{m.project}</h3>
                      <div className="ml">
                        {m.locality} · {m.developer || "Developer"}
                      </div>
                      <div className="mstats">
                        <span>
                          <b>{num(m.total)}</b> leads
                        </span>
                        <span>
                          <b>{m.pool}</b> in shared pool
                        </span>
                        <span>
                          <b>{m.today.calls}</b> calls today
                        </span>
                        <span>
                          <b>{m.counts.vp + m.counts.vc}</b> visits lined up
                        </span>
                        <span>
                          <b>{m.counts.walkin}</b> walk-ins
                        </span>
                      </div>
                      <div className="avstack">
                        {m.agents
                          .filter((a) => a.active)
                          .map((a) => (
                            <AvA key={a.id} name={a.name} />
                          ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-w">
                No live mandates yet.{" "}
                <button className="link" onClick={() => go("create")}>
                  Create one
                </button>
              </p>
            )}
          </section>
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Live activity</p>
                <h2>What your agents just did</h2>
              </div>
              <span className="hint">From the tele-caller app, as it happens</span>
            </div>
            {data.feed.length ? (
              <div className="feed">
                {data.feed.map((e) => (
                  <div className="fi" key={e.id}>
                    <span className={"fic " + feedTone(e)}>
                      <Icon n={feedIcon(e)} s={15} />
                    </span>
                    <p>
                      {feedLine(e)} <span style={{ color: "var(--ink-3)" }}>· {e.project}</span>
                    </p>
                    <small>{fmtTime(e.created_at)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-w">No calls yet today.</p>
            )}
          </section>
        </div>
        <div className="stack">
          {data.pending_launches ? (
            <button className="cta-card" onClick={() => go("launches")}>
              <span className="ci">
                <Icon n="cards" s={21} />
              </span>
              <div>
                <b>
                  {data.pending_launches} developer launch{data.pending_launches > 1 ? "es" : ""} want your network
                </b>
                <span>Swipe to participate or pass</span>
              </div>
              <Icon n="chevR" s={20} />
            </button>
          ) : null}
          {data.open_support ? (
            <button className="cta-card" onClick={() => go("profile", "requests")}>
              <span className="ci">
                <Icon n="help" s={21} />
              </span>
              <div>
                <b>
                  {data.open_support} request{data.open_support > 1 ? "s" : ""} from your agents
                </b>
                <span>Password resets and messages from the app</span>
              </div>
              <Icon n="chevR" s={20} />
            </button>
          ) : null}
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Needs attention</p>
                <h2>{!adv ? "Red flags" : flags.length ? `${flags.length} red flag${flags.length > 1 ? "s" : ""} today` : "No red flags today"}</h2>
              </div>
              {adv && flags.length ? (
                <button className="link" onClick={() => go("perf")}>
                  Give feedback
                </button>
              ) : null}
            </div>
            {!adv ? (
              <>
                <p className="hint" style={{ margin: "0 0 12px" }}>
                  Red flags and agent feedback are part of the Pro plan’s advanced performance summary.
                </p>
                <button className="btn sm line" onClick={() => go("profile", "plan")}>
                  <Icon n="crown" s={15} />
                  See plans
                </button>
              </>
            ) : flags.length ? (
              flags.slice(0, 7).map((x, i) => (
                <div className="flagrow" key={i}>
                  <AvA name={x.a.name} />
                  <div className="fx">
                    <b>{x.a.name}</b>
                    <p>
                      {x.f.text} · {x.f.detail}
                    </p>
                  </div>
                  <span className="flagc">
                    <Icon n="flag" s={12} />
                    {FLAG_TAG[x.f.k]}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-w">Every agent is on track.</p>
            )}
          </section>
          <section className="panel">
            <div className="panel-h">
              <div>
                <p className="eyebrow">Your team</p>
                <h2>{data.agents.length} active agents</h2>
              </div>
              <button className="link" onClick={() => go("profile", "agents")}>
                Manage
              </button>
            </div>
            {data.agents.map((a) => (
              <div className="flagrow" key={a.id}>
                <AvA name={a.name} />
                <div className="fx">
                  <b>{a.name}</b>
                  <p className="mono">{a.login_id}</p>
                </div>
                <BarIn v={a.today.calls} max={a.daily_target} label={a.today.calls + " calls"} />
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
