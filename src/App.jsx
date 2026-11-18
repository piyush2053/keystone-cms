import { useEffect } from "react";
import { useRoute } from "./nav";
import { Icon, Logo } from "./lib";
import { APP_URL } from "./Shell";
import BrokerApp from "./broker/BrokerApp";
import DeveloperApp from "./developer/DeveloperApp";
import OwnerApp from "./owner/OwnerApp";


export default function App() {
  const [area, page, sub] = useRoute();
  useEffect(() => {
    document.body.className = "r-" + (area === "broker" || area === "developer" || area === "admin" ? area : "portal");
    document.title = area === "broker" ? "Keystone for Brokers" : area === "developer" ? "Keystone for Developers" : area === "admin" ? "Keystone owner console" : "Keystone";
  }, [area]);
  if (area === "broker") return <div className="webroot"><BrokerApp page={page || "home"} sub={sub} /></div>;
  if (area === "developer") return <div className="webroot"><DeveloperApp page={page || "home"} sub={sub} /></div>;
  if (area === "admin") return <div className="webroot"><OwnerApp page={page || "overview"} /></div>;
  return <Portal />;
}

function Portal() {
  const cards = [
    { href: APP_URL || null, icon: "smartphone", who: "For calling agents", title: "Tele-caller app", text: "Work the day’s leads with the phone’s own dialer, automatic sorting into nine buckets and a dated journey for every lead.", go: APP_URL ? "Open the app" : "Android and iPhone app" },
    { href: "#/broker", icon: "briefcase", who: "For brokers and CPs", title: "Broker website", text: "Run mandates, upload Excel data, move leads between agents, catch red flags, manage agent logins and pick developer launches with a swipe.", go: "Open the broker site" },
    { href: "#/developer", icon: "building", who: "For developers", title: "Developer website", text: "See daily performance on mandates brokers share, view only, and run paid campaigns that reach active channel partners.", go: "Open the developer site" },
  ];
  const A = (dir, text) => (
    <div className={"farrow " + dir}>
      <span>{dir === "r" ? text + " →" : "← " + text}</span>
      <span className="ln" />
    </div>
  );
  return (
    <div className="portal">
      <div className="portal-in">
        <div className="ph">
          <Logo s={44} light />
          <b>Keystone</b>
        </div>
        <h1>One system for tele-callers, brokers and developers</h1>
        <p className="lede">Three connected products on the same data. Brokers run mandates and agents, agents call from their own phones, developers see how their projects are selling.</p>
        <div className="pcards">
          {cards.map((c) => {
            const body = (
              <>
                <span className="pi">
                  <Icon n={c.icon} s={24} />
                </span>
                <small>{c.who}</small>
                <h2>{c.title}</h2>
                <p>{c.text}</p>
                <span className="go">
                  {c.go}
                  {c.href ? <Icon n="forward" s={16} /> : null}
                </span>
              </>
            );
            return c.href ? (
              <a key={c.title} className="pcard" href={c.href}>
                {body}
              </a>
            ) : (
              <div key={c.title} className="pcard">
                {body}
              </div>
            );
          })}
        </div>
        <section className="flow">
          <p className="eyebrow" style={{ color: "var(--gold-2)" }}>How they talk to each other</p>
          <h2 style={{ marginTop: 4 }}>Every action flows through the same record</h2>
          <div className="flowgrid">
            <div className="fnode">
              <Icon n="building" s={24} />
              <b>Developer</b>
              <small>Property owner</small>
            </div>
            <div className="farrows">
              {A("r", "Paid launch campaigns")}
              {A("l", "View-only performance, per mandate")}
            </div>
            <div className="fnode">
              <Icon n="briefcase" s={24} />
              <b>Broker</b>
              <small>Channel partner</small>
            </div>
            <div className="farrows">
              {A("r", "Mandates, leads, logins, transfers, approved launches")}
              {A("l", "Every call, outcome and site visit, live")}
            </div>
            <div className="fnode">
              <Icon n="smartphone" s={24} />
              <b>Tele-caller</b>
              <small>Calling agents</small>
            </div>
          </div>
        </section>
        <div className="note">
          <Icon n="layers" s={16} />
          <span>Brokers sign in with the user ID Keystone gives them. Developers and agents get their logins from their broker.</span>
          <a className="gbtn" href="#/admin" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Owner console
          </a>
        </div>
      </div>
    </div>
  );
}
