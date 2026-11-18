import { goTo } from "../nav";
import { Icon } from "../lib";
import { Boot, WebLogin, WebShell, useSession } from "../Shell";
import Home from "./Home";
import Mandates from "./Mandates";
import CreateMandate from "./CreateMandate";
import Performance from "./Performance";
import Launches from "./Launches";
import Profile from "./Profile";

const PAGES = { home: Home, mandates: Mandates, create: CreateMandate, perf: Performance, launches: Launches, profile: Profile };

export default function BrokerApp({ page, sub }) {
  const s = useSession("broker");
  if (s.me === undefined) return <Boot />;
  if (!s.me)
    return (
      <WebLogin
        kind="broker"
        title="Every mandate, agent and lead in one place"
        lede="Upload lead data, assign it to agents or a shared pool, move leads between agents, and see who needs feedback today."
        onSignIn={s.signIn}
        forgot="Forgot your password? Contact Keystone support to reset it."
      />
    );
  const me = s.me;
  const nav = [
    { id: "home", label: "Home", icon: "grid" },
    { id: "mandates", label: "Current mandates", icon: "briefcase" },
    { id: "create", label: "Create mandate", icon: "plus" },
    { id: "perf", label: "Performance", icon: "chart" },
    { id: "launches", label: "New launches", icon: "cards", badge: me.pending_launches || null },
    { id: "profile", label: "Profile", icon: "user", badge: me.open_support || null },
  ];
  const C = PAGES[page] || Home;
  const go = (p, sub2) => goTo("broker/" + p + (sub2 ? "/" + sub2 : ""));
  return (
    <WebShell
      kind="broker"
      nav={nav}
      page={PAGES[page] ? page : "home"}
      go={(p) => go(p)}
      user={{ name: me.owner_name, photo: me.photo, line: me.plan.name + " plan · " + (me.city || me.firm) }}
      crumb={
        <>
          {me.firm} · <b>{(nav.find((n) => n.id === page) || nav[0]).label}</b>
        </>
      }
      right={
        me.plan.expired ? (
          <button className="btn sm line" onClick={() => go("profile", "plan")}>
            <Icon n="crown" s={15} />
            Plan expired · renew
          </button>
        ) : null
      }
      onSignOut={s.signOut}
    >
      <C key={page + (sub || "")} me={me} sub={sub} go={go} reloadMe={s.reload} />
    </WebShell>
  );
}
