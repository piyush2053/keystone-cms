import { goTo } from "../nav";
import { Icon } from "../lib";
import { Boot, WebLogin, WebShell, useSession } from "../Shell";
import { DevHome, DevMandates } from "./Home";
import DevPerformance from "./Performance";
import Campaigns from "./Campaigns";
import DevProfile from "./Profile";

const PAGES = { home: DevHome, mandates: DevMandates, perf: DevPerformance, campaigns: Campaigns, profile: DevProfile };

export default function DeveloperApp({ page, sub }) {
  const s = useSession("developer");
  if (s.me === undefined) return <Boot />;
  if (!s.me)
    return (
      <WebLogin
        kind="developer"
        title="See how your mandates are selling, every day"
        lede="Brokers share view-only performance for your projects. Run paid campaigns to put a launch in front of active channel partners."
        onSignIn={s.signIn}
        forgot="Your login comes from your broker partner or a teammate. Ask them to reset it if needed."
      />
    );
  const me = s.me;
  const nav = [
    { id: "home", label: "Home", icon: "grid" },
    { id: "mandates", label: "Current mandates", icon: "briefcase" },
    { id: "perf", label: "Performance", icon: "chart" },
    { id: "campaigns", label: "Campaigns", icon: "megaphone" },
    { id: "profile", label: "Profile", icon: "user" },
  ];
  const C = PAGES[page] || DevHome;
  const go = (p, sub2) => goTo("developer/" + p + (sub2 ? "/" + sub2 : ""));
  return (
    <WebShell
      kind="developer"
      nav={nav}
      page={PAGES[page] ? page : "home"}
      go={(p) => go(p)}
      user={{ name: me.name, line: (me.role ? me.role + " · " : "") + me.company }}
      crumb={
        <>
          {me.company} · <b>{(nav.find((n) => n.id === page) || nav[0]).label}</b>
        </>
      }
      right={
        <span className="mutc">
          <Icon n="eye" s={13} />
          View only
        </span>
      }
      onSignOut={s.signOut}
    >
      <C key={page + (sub || "")} me={me} sub={sub} go={go} reloadMe={s.reload} />
    </WebShell>
  );
}
