import { useEffect, useRef, useState } from "react";
import { api, bump, useApi } from "../api";
import { Art, ErrorNote, Icon, Loading, Seg, ago, fmtDate, toast, toastError } from "../lib";

/** A launch card, as brokers see it in the deck (also used for the developer's preview). */
export function SwipeCard({ c, cls, style, stampX, handlers }) {
  return (
    <div className={"scard " + (cls || "")} style={style} {...(handlers || {})}>
      <span className="stamp yes" style={{ opacity: Math.max(0, Math.min(1, (stampX || 0) / 90)) }}>
        Participate
      </span>
      <span className="stamp no" style={{ opacity: Math.max(0, Math.min(1, -(stampX || 0) / 90)) }}>
        Pass
      </span>
      <div className="art">
        <Art id={c.project_id} locality={c.project_locality} />
        <span className="badge-tl">{(c.tag || "New launch") + " · Sponsored"}</span>
      </div>
      <div className="sb">
        <div>
          <h3>{c.name}</h3>
          <div className="sl">
            {c.project_locality} · by {c.developer}
          </div>
        </div>
        <div className="terms">
          <Icon n="crown" s={18} />
          <span>
            <b>{c.headline}</b>
          </span>
        </div>
        <ul>
          {(c.highlights || []).slice(0, 3).map((h) => (
            <li key={h}>
              <Icon n="spark" s={14} />
              {h}
            </li>
          ))}
          {!c.highlights?.length && c.message ? (
            <li>
              <Icon n="spark" s={14} />
              {c.message}
            </li>
          ) : null}
        </ul>
        <div className="sm">
          <div>
            From<b>{c.price_from || "—"}</b>
          </div>
          <div>
            Homes<b>{(c.configurations || []).join(", ") || "—"}</b>
          </div>
          <div>
            Possession<b>{c.possession || "—"}</b>
          </div>
          <div>
            Ends<b>{c.ends_at ? fmtDate(c.ends_at) : "—"}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function Deck({ items, onDecide }) {
  const [dx, setDx] = useState(0),
    [fly, setFly] = useState(null);
  const drag = useRef(null);
  const top = items[0];
  const go = (v) => {
    if (!top || fly) return;
    setFly(v);
    setTimeout(() => {
      onDecide(top, v);
      setFly(null);
      setDx(0);
    }, 300);
  };
  useEffect(() => {
    const h = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || "")) return;
      if (e.key === "ArrowRight") go("accepted");
      if (e.key === "ArrowLeft") go("rejected");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  if (!top)
    return (
      <div className="panel">
        <div className="lock">
          <span className="li">
            <Icon n="check" s={24} />
          </span>
          <h2>All caught up</h2>
          <p>New developer promotions appear here as soon as a campaign reaches your network.</p>
        </div>
      </div>
    );
  const handlers = {
    onPointerDown: (e) => {
      if (fly) return;
      drag.current = { x: e.clientX };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* older browsers */
      }
    },
    onPointerMove: (e) => drag.current && setDx(e.clientX - drag.current.x),
    onPointerUp: () => {
      if (!drag.current) return;
      drag.current = null;
      if (Math.abs(dx) > 110) go(dx > 0 ? "accepted" : "rejected");
      else setDx(0);
    },
    onPointerCancel: () => {
      drag.current = null;
      setDx(0);
    },
  };
  const tx = fly ? (fly === "accepted" ? 640 : -640) : dx;
  const stack = items.slice(0, 3);
  return (
    <div>
      <div className="deck">
        {stack
          .slice()
          .reverse()
          .map((c, i) => {
            const depth = stack.length - 1 - i;
            if (depth === 0)
              return (
                <SwipeCard
                  key={c.id}
                  c={c}
                  cls={fly ? "fly" : ""}
                  stampX={fly ? (fly === "accepted" ? 120 : -120) : dx}
                  handlers={handlers}
                  style={{ transform: `translateX(${tx}px) rotate(${tx / 18}deg)`, ...(fly ? { opacity: 0 } : {}), ...(drag.current ? {} : { transition: "transform .25s ease" }) }}
                />
              );
            return <SwipeCard key={c.id} c={c} cls={depth === 1 ? "back1" : "back2"} />;
          })}
      </div>
      <div className="deckbtns">
        <button className="dbtn no" onClick={() => go("rejected")} aria-label="Pass">
          <Icon n="x" s={28} w={2.2} />
        </button>
        <button className="dbtn yes" onClick={() => go("accepted")} aria-label="Participate">
          <Icon n="heart" s={26} w={2} />
        </button>
      </div>
      <p className="decklbl">Swipe or drag the card · ← pass · → participate · {items.length} waiting</p>
    </div>
  );
}

export default function Launches() {
  const { data, error, reload } = useApi("broker", "/broker/launches");
  const [tab, setTab] = useState("new");
  const [gone, setGone] = useState(new Set());
  if (!data) return error ? <ErrorNote error={error} retry={reload} /> : <Loading />;
  const pending = data.pending.filter((c) => !gone.has(c.id));
  const yes = data.history.filter((c) => c.status === "accepted"),
    no = data.history.filter((c) => c.status === "rejected");
  const decide = async (c, status) => {
    setGone(new Set([...gone, c.id]));
    try {
      await api("broker", "/broker/launches/" + c.id, { body: { status } });
      toast(status === "accepted" ? { title: "You’re in for " + c.name, line: "Your agents can pitch it from the app now", tone: "ok", icon: "heart" } : { title: "Passed on " + c.name, line: "Change your mind any time under Passed", icon: "x" });
      bump();
    } catch (e) {
      toastError(e);
      setGone((g) => new Set([...g].filter((x) => x !== c.id)));
    }
  };
  const top = pending[0];
  const miniList = (items, v) =>
    items.length ? (
      <div className="ministack">
        {items.map((c) => (
          <div className="mini" key={c.id}>
            <Art id={c.project_id} locality={c.project_locality} />
            <div className="mb">
              <h3>{c.name}</h3>
              <div className="ml">
                {c.project_locality} · {c.developer}
              </div>
              <div className="ml">{c.headline}</div>
              <div className="mf">
                <span className="hint">Decided {ago(c.responded_at)}</span>
                <button className="btn sm line" onClick={() => decide(c, v === "accepted" ? "rejected" : "accepted")}>
                  <Icon n="undo" s={14} />
                  {v === "accepted" ? "Pass instead" : "Participate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="panel">
        <p className="empty-w">Nothing here yet.</p>
      </div>
    );
  return (
    <>
      <div className="page-h">
        <div>
          <p className="eyebrow">New launches</p>
          <h1>Developer promotions</h1>
          <p className="sub">Developers pay to reach channel partners. Participate and your agents can pitch the project from their app straight away.</p>
        </div>
        <Seg
          opts={[
            ["new", `Requests (${pending.length})`],
            ["yes", `Participating (${yes.length})`],
            ["no", `Passed (${no.length})`],
          ]}
          val={tab}
          set={setTab}
        />
      </div>
      {tab === "new" ? (
        <div className="deckwrap">
          <Deck items={pending} onDecide={decide} />
          {top ? (
            <div className="stack">
              <section className="panel">
                <div className="panel-h">
                  <div>
                    <p className="eyebrow">This request</p>
                    <h2>{top.name}</h2>
                    <p className="sub">
                      {top.project_locality} · {top.developer} · started {ago(top.starts_at)}
                    </p>
                  </div>
                </div>
                {top.message ? <p style={{ marginTop: 0 }}>{top.message}</p> : null}
                {top.units?.length ? (
                  <table className="utable">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Carpet</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top.units.map((u) => (
                        <tr key={u.config}>
                          <td>{u.config}</td>
                          <td className="mono">{u.carpet}</td>
                          <td className="p">{u.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
                {top.amenities?.length ? (
                  <>
                    <div className="flabel">Amenities</div>
                    <div className="wrapchips">
                      {top.amenities.map((a) => (
                        <span key={a} className="chip">
                          {a}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}
              </section>
              <section className="panel">
                <p className="eyebrow">How it works</p>
                <ul className="hl" style={{ marginTop: 10 }}>
                  <li>
                    <Icon n="heart" s={15} />
                    Participate: the project appears in New Launches for all your agents.
                  </li>
                  <li>
                    <Icon n="x" s={15} />
                    Pass: it disappears from your deck. You can change your mind later.
                  </li>
                  <li>
                    <Icon n="crown" s={15} />
                    Brokerage and offers are set by the developer, shown on each card.
                  </li>
                </ul>
              </section>
            </div>
          ) : null}
        </div>
      ) : tab === "yes" ? (
        miniList(yes, "accepted")
      ) : (
        miniList(no, "rejected")
      )}
    </>
  );
}
