import { useState } from "react";
import { api } from "../api";
import { Icon } from "../lib";

const FIRST = ["Priya", "Aarav", "Neha", "Vikram", "Ananya", "Karan", "Isha", "Arjun", "Kavya", "Meera", "Aditya", "Pooja", "Nikhil", "Riya", "Varun", "Tanvi", "Harsh", "Shruti", "Divya", "Yash"];
const LAST = ["Mehta", "Iyer", "Kulkarni", "Desai", "Patil", "Joshi", "Nair", "Menon", "Kapoor", "Gupta", "Rao", "Shetty", "Chavan", "Pillai", "Bhatt", "Khan", "Shah", "Naik"];
const SOURCES = ["Meta Ads", "Google Search", "99acres", "MagicBricks", "Housing.com", "Reference", "Website", "Channel partner"];
// A practice file: fictional 90000-series numbers (not for dialling), a few bad rows and duplicates.
function sampleCsv(agents) {
  const rows = [["Name", "Mobile", "Source", "Configuration", "Budget", "Agent user ID"]];
  for (let i = 0; i < 60; i++) {
    let phone = "90000" + String(Math.floor(Math.random() * 1e5)).padStart(5, "0");
    if (i === 7 || i === 33) phone = String(Math.floor(Math.random() * 1e6));
    if (i === 12 || i === 40) phone = rows[i - 3][1];
    const ag = agents.length && i < 24 ? agents[i % agents.length].login_id : "";
    rows.push([FIRST[i % FIRST.length] + " " + LAST[(i * 7) % LAST.length], phone, SOURCES[i % SOURCES.length], i % 3 ? "2 BHK" : "3 BHK", "", ag]);
  }
  return rows.map((r) => r.join(",")).join("\n");
}

/** Upload → server-side parse → preview → choose who gets the leads. */
export default function LeadUploader({ agents, data, setData }) {
  const [over, setOver] = useState(false),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  const parse = async (file, name) => {
    setBusy(true);
    setErr("");
    const form = new FormData();
    form.append("file", file, name || file.name);
    try {
      const r = await api("broker", "/broker/imports/parse", { form });
      const named = r.rows.some((x) => !x.issue && x.agent_login);
      setData({ rows: r.rows, fileName: r.file, mode: data?.mode || (named ? "column" : "split") });
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };
  const ok = data ? data.rows.filter((x) => !x.issue) : [];
  const bad = data ? data.rows.filter((x) => x.issue) : [];
  const byLogin = new Map(agents.map((a) => [a.login_id.toLowerCase(), a]));
  const assignOf = (row, i) => {
    if (!data || data.mode === "pool") return null;
    if (data.mode === "split") return agents.length ? agents[i % agents.length] : null;
    return byLogin.get(row.agent_login) || null;
  };
  const unknownAgents = data && data.mode === "column" ? ok.filter((r) => r.agent_login && !byLogin.has(r.agent_login)).length : 0;
  return (
    <div>
      <div
        className={"dropzone" + (over ? " over" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files[0]) parse(e.dataTransfer.files[0]);
        }}
      >
        <Icon n="file" s={28} />
        <b>{busy ? "Reading the file…" : data ? data.fileName : "Drop an Excel or CSV file here"}</b>
        <span>{data ? data.rows.length + " rows found" : "One lead per row. The first row holds the column names."}</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
          <label className="btn sm line" style={{ cursor: "pointer" }}>
            <input type="file" accept=".xlsx,.csv" style={{ display: "none" }} onChange={(e) => e.target.files[0] && parse(e.target.files[0])} />
            Choose file
          </label>
          <button className="btn sm" onClick={() => parse(new Blob([sampleCsv(agents)], { type: "text/csv" }), "sample-leads.csv")}>
            Use sample file (60 leads)
          </button>
        </div>
      </div>
      {err ? (
        <p className="err" style={{ marginTop: 10 }}>
          {err}
        </p>
      ) : null}
      {!data ? (
        <>
          <div className="flabel">Expected format</div>
          <div className="tbl-wrap" style={{ margin: 0, padding: 0 }}>
            <table className="fmt">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Source</th>
                  <th>Configuration</th>
                  <th>Budget</th>
                  <th>Agent user ID</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rohit Shah</td>
                  <td>9820431546</td>
                  <td>Meta Ads</td>
                  <td>2 BHK</td>
                  <td>₹1.5 Cr</td>
                  <td>aniket.sawant</td>
                </tr>
                <tr>
                  <td>Priya Nair</td>
                  <td>9930012345</td>
                  <td>Website</td>
                  <td>3 BHK</td>
                  <td></td>
                  <td className="muted">blank = shared pool</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="hint">Name and Mobile are required. Leave Agent user ID blank to put a lead in the shared pool. Excel (.xlsx) or CSV.</p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0 4px" }}>
            <span className="okc">
              <Icon n="check" s={12} />
              {ok.length} ready
            </span>
            {bad.length ? <span className="flagc">{bad.length} skipped</span> : null}
            <span className="mutc">{ok.filter((x) => x.agent_login).length} name an agent</span>
          </div>
          <div className="flabel">Who gets these leads</div>
          <div className="radios">
            {[
              ["column", "Use the Agent column", "Named agents get their rows. Rows with no agent go to the shared pool."],
              ["split", "Split evenly across the selected agents", "Ignores the Agent column. Round-robin, one lead each in turn."],
              ["pool", "Keep all in the shared pool", "Every agent on the mandate sees them in Fresh. The first to act on a lead gets it."],
            ].map(([k, t, d]) => (
              <button key={k} className={"radio" + (data.mode === k ? " on" : "")} onClick={() => setData({ ...data, mode: k })}>
                <span className="dotr" />
                <div>
                  <b>{t}</b>
                  <small>{d}</small>
                </div>
              </button>
            ))}
          </div>
          {unknownAgents ? <p className="hint">{unknownAgents} rows name an agent who isn’t on this mandate. They go to the shared pool.</p> : null}
          <div className="flabel">Preview</div>
          <div className="tbl-wrap">
            <table className="tbl" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Source</th>
                  <th>Goes to</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.slice(0, 9).map((r) => {
                  const a = r.issue ? null : assignOf(r, ok.indexOf(r));
                  return (
                    <tr key={r.row}>
                      <td>{r.name || "—"}</td>
                      <td className="mono">{r.phone || "—"}</td>
                      <td>{r.source}</td>
                      <td>
                        {r.issue ? (
                          <span className="flagc">{r.issue}</span>
                        ) : a ? (
                          a.name
                        ) : (
                          <span className="tag pool" style={{ margin: 0 }}>
                            Pool
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {bad.length ? (
            <p className="hint">
              Skipped rows:{" "}
              {[...new Set(bad.map((b) => b.issue))].map((x) => bad.filter((b) => b.issue === x).length + " × " + x.toLowerCase()).join(", ")}.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
/** Body for the API: valid rows + assignment. */
export const uploadPayload = (data, agents) => ({
  rows: data.rows
    .filter((r) => !r.issue)
    .map(({ name, phone, source, configuration, budget, agent_login }) => ({ name, phone, source, configuration, budget, agent_login })),
  assign: { mode: data.mode, agent_ids: agents.map((a) => a.id) },
});
