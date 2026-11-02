import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
} from "react";
import { api } from "./api";
import "./App.css";

const calendar = new Date();
const roles = {
  tele_caller: "Tele-caller",
  team_lead: "Team lead",
  org_admin: "Organization admin",
  support_operator: "Support operator",
};
const plans = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};
const actions = {
  "organization.onboarded": "Organization onboarded",
  "organization.updated": "Organization updated",
  "user.created": "User created",
  "user.updated": "User updated",
  "team.created": "Team created",
  "team.updated": "Team updated",
  "owner.profile_updated": "Owner profile updated",
};
const navigation = [
  ["overview", "Overview", "grid"],
  ["organizations", "Organizations", "building"],
  ["users", "People", "users"],
  ["teams", "Teams", "layers"],
  ["activity", "Activity log", "clock"],
];
const headings = {
  overview: [
    "Your platform, at a glance.",
    "A clear view of every organization and the people behind it.",
  ],
  organizations: [
    "A home for every organization.",
    "Onboard, organize and support your customer workspaces.",
  ],
  users: [
    "Good work starts with people.",
    "Create accounts and manage access across every organization.",
  ],
  teams: [
    "Bring the right people together.",
    "Build teams, assign leads and keep ownership clear.",
  ],
  activity: [
    "Every action, accounted for.",
    "A permanent record of changes made from this control center.",
  ],
  settings: [
    "Your corner of Keystone.",
    "Manage your owner profile and account security.",
  ],
};
const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
const count = (value) => Number(value || 0).toLocaleString("en-IN");
const date = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const time = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
// Matches the app Logo in FE/src/ui.tsx.
function Logo({ size = 39, light = false }) {
  return (
    <span className="keystone-logo" role="img" aria-label="Keystone"
      style={{ width: size, height: size, fontSize: size, color: light ? "#FFFFFF" : "#0E1A2B" }}>
      <span className="keystone-logo-arch" />
      <span className="keystone-logo-stone" />
    </span>
  );
}

function Icon({ name, size = 20 }) {
  const paths = {
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    building:
      "M4 21V5l8-3 8 3v16M2 21h20M8 7v2m8-2v2M8 12v2m8-2v2M10 21v-4h4v4",
    users:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8m6 10v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    layers: "m12 3 10 5-10 5L2 8l10-5zm-10 9 10 5 10-5M2 16l10 5 10-5",
    clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
    plus: "M12 5v14M5 12h14",
    arrow: "M5 12h14m-5-5 5 5-5 5",
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    close: "m6 6 12 12M6 18 18 6",
    chevron: "m9 5 7 7-7 7",
    check: "m5 12 4 4L19 6",
    copy: "M9 9h12v12H9zM15 5V3H3v12h2",
    logout: "M9 21H3V3h6m6 5 5 4-5 4m-7-4h12",
    refresh: "M20 7V3l-4 4M4 17v4l4-4M20 7a9 9 0 0 0-15-2M4 17a9 9 0 0 0 15 2",
    shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4zm-4 10 3 3 5-6",
    menu: "M3 6h18M3 12h18M3 18h18",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    edit: "m16 3 5 5-12 12-6 1 1-6L16 3zm-3 3 5 5",
    lock: "M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
function useResource(path, refresh = 0) {
  const [state, setState] = useState({
    data: null,
    path: null,
    key: "",
    error: "",
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const key = path + "#" + refresh + "#" + version;
    api(path, { signal: controller.signal })
      .then((data) => setState({ data, path, key, error: "" }))
      .catch((error) => {
        if (error.name !== "AbortError")
          setState({ data: null, path, key, error: error.message });
      });
    return () => controller.abort();
  }, [path, refresh, version]);
  const loading = !!path && state.key !== path + "#" + refresh + "#" + version;
  return {
    data: state.path === path ? state.data : null,
    loading,
    error: loading ? "" : state.error,
    reload: () => setVersion((x) => x + 1),
  };
}
function useDebounce(value) {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDelayed(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return delayed;
}
function Button({ children, icon, secondary, danger, ...props }) {
  return (
    <button
      className={
        "button " + (secondary ? "secondary " : "") + (danger ? "danger" : "")
      }
      {...props}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  );
}
function Field({ label, children, hint, ...props }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {isValidElement(children)
        ? cloneElement(children, { id, "aria-label": label })
        : children || <input id={id} aria-label={label} {...props} />}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Password({
  value,
  onChange,
  label = "Initial password",
  required = true,
  generate = false,
  current = false,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {generate && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              const chars =
                "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
              onChange(
                "Ks!" +
                  Array.from(
                    crypto.getRandomValues(new Uint8Array(18)),
                    (byte) => chars[byte % chars.length],
                  ).join(""),
              );
              setVisible(true);
            }}
          >
            Generate password
          </button>
        )}
      </div>
      <div className="password-input">
        <input
          aria-label={label}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={!current && required ? 12 : undefined}
          maxLength={72}
          autoComplete={current ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Show or hide password"
          onClick={() => setVisible(!visible)}
        >
          <Icon name="eye" size={17} />
        </button>
      </div>
      {!current && (
        <small>
          At least 12 characters. Share initial credentials securely.
        </small>
      )}
    </div>
  );
}
function Pill({ status }) {
  return (
    <span className={"pill " + status}>
      <i />
      {status === "disabled"
        ? "Disabled"
        : status === "suspended"
          ? "Suspended"
          : "Active"}
    </span>
  );
}
function Avatar({ name, small }) {
  return (
    <span className={"avatar " + (small ? "small" : "")}>{initials(name)}</span>
  );
}
function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="building" size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Resource({ resource, children }) {
  if (resource.loading && !resource.data)
    return (
      <div className="loading-panel">
        <span className="spinner" />
        Loading workspace…
      </div>
    );
  if (resource.error)
    return (
      <div className="error-panel" role="alert">
        <strong>We couldn't load this view.</strong>
        <p>{resource.error}</p>
        <Button secondary onClick={resource.reload} icon="refresh">
          Try again
        </Button>
      </div>
    );
  return resource.data ? children(resource.data) : null;
}
function Search({ value, onChange, placeholder }) {
  return (
    <div className="search">
      <Icon name="search" size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}
function OrgSelect({ id, value, onChange, organizations, all = true }) {
  return (
    <select
      id={id}
      aria-label="Organization"
      required={!all}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">
        {all ? "All organizations" : "Select an organization"}
      </option>
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
          {org.status === "suspended" ? " · Suspended" : ""}
        </option>
      ))}
    </select>
  );
}
function Pager({ data, page, setPage }) {
  return (
    <div className="pager">
      <span>
        {data.total
          ? (page - 1) * data.limit +
            1 +
            "–" +
            Math.min(page * data.limit, data.total)
          : "0"}{" "}
        of {count(data.total)} records
      </span>
      <div>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * data.limit >= data.total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const before = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = [
          ...document.querySelectorAll(
            '[role="dialog"] button:not(:disabled),[role="dialog"] input:not(:disabled),[role="dialog"] select,[role="dialog"] textarea',
          ),
        ];
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handler);
      before?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <span className="eyebrow">KEYSTONE CONTROL CENTER</span>
            <h2>{title}</h2>
          </div>
          <button
            autoFocus
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Login({ onLogin, initialError }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(initialError || ""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(
        await api("/auth/login", { method: "POST", body: { email, password } }),
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <aside className="login-story">
        <div className="brand">
          <Logo light />
          <span>
            keystone<span className="brand-sub">CONTROL CENTER</span>
          </span>
        </div>
        <div className="login-story-content">
          <span className="eyebrow">THE BIGGER PICTURE</span>
          <h1>
            Every organization.
            <br />
            One clear view.
          </h1>
          <p>
            The owner's workspace for welcoming organizations, empowering their
            people and building stronger foundations.
          </p>
          <div className="login-illustration">
            <div className="orbit o1" />
            <div className="orbit o2" />
            <div className="orbit o3" />
            <div className="orbit-center">
              <Logo size={64} light />
            </div>
            <span className="orbit-node n1">
              <Icon name="building" />
            </span>
            <span className="orbit-node n2">
              <Icon name="users" />
            </span>
            <span className="orbit-node n3">
              <Icon name="layers" />
            </span>
          </div>
        </div>
        <small>A stronger foundation for every conversation.</small>
      </aside>
      <main className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <span className="login-lock">
            <Icon name="shield" size={26} />
          </span>
          <span className="eyebrow">PLATFORM OWNER ACCESS</span>
          <h2>Welcome back.</h2>
          <p>Sign in to your Keystone control center.</p>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <Field
            label="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder="you@company.com"
          />
          <Password
            label="Password"
            value={password}
            onChange={setPassword}
            current
          />
          <Button type="submit" icon="arrow" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to workspace"}
          </Button>
          <div className="login-note">
            <Icon name="lock" size={15} />
            Reserved for Keystone platform owners. Organization admins sign in
            through the app.
          </div>
        </form>
        <small className="login-copyright">
          KEYSTONE © {calendar.getFullYear()} · OWNER WORKSPACE
        </small>
      </main>
    </div>
  );
}
function Stat({ title, value, note, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className={"stat-icon " + color}>
          <Icon name={icon} size={19} />
        </span>
      </div>
      <strong>{count(value)}</strong>
      <small>{note}</small>
    </div>
  );
}
function OrganizationRows({ items, onOpen, compact = false }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Organization</th>
            <th>Plan</th>
            <th>People</th>
            <th>Status</th>
            {!compact && <th>Onboarded</th>}
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((org) => (
            <tr key={org.id}>
              <td>
                <div className="identity">
                  <Avatar name={org.name} />
                  <div>
                    <button
                      className="name-button"
                      onClick={() => onOpen(org.id)}
                    >
                      {org.name}
                    </button>
                    <small>
                      {org.contact_email || org.id.slice(0, 8) + "…"}
                    </small>
                  </div>
                </div>
              </td>
              <td>
                <span className={"plan " + org.plan}>{plans[org.plan]}</span>
              </td>
              <td>
                <span className="count-label">
                  <Icon name="users" size={15} />
                  {count(org.user_count)}
                </span>
              </td>
              <td>
                <Pill status={org.status} />
              </td>
              {!compact && <td className="muted">{date(org.created_at)}</td>}
              <td>
                <button
                  className="row-action"
                  aria-label={"Manage " + org.name}
                  onClick={() => onOpen(org.id)}
                >
                  <Icon name="arrow" size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Overview({ summary, refresh, onNavigate, onOpen, onCreate }) {
  const activity = useResource("/activity?limit=5", refresh);
  return (
    <Resource resource={summary}>
      {(data) => {
        const max = Math.max(
          1,
          ...data.months.flatMap((month) => [month.users, month.organizations]),
        );
        return (
          <>
            <div className="welcome-line">
              <span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span>
              <span className="today">
                {calendar.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="stats-grid">
              <Stat
                title="Organizations"
                value={data.stats.organizations}
                note={data.stats.new_this_month + " onboarded this month"}
                icon="building"
                color="blue"
              />
              <Stat
                title="Active workspaces"
                value={data.stats.active_organizations}
                note={
                  data.stats.suspended_organizations + " currently suspended"
                }
                icon="shield"
                color="green"
              />
              <Stat
                title="People on Keystone"
                value={data.stats.users}
                note={data.stats.active_users + " with active access"}
                icon="users"
                color="purple"
              />
              <Stat
                title="Teams working together"
                value={data.stats.teams}
                note="Across your organizations"
                icon="layers"
                color="amber"
              />
            </div>
            <div className="overview-middle">
              <section className="panel growth-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">STEADY FOUNDATIONS</span>
                    <h3>Your platform's growth</h3>
                    <p>New organizations and people, month by month.</p>
                  </div>
                  <span className="period">Last 6 months</span>
                </div>
                <div className="chart-legend">
                  <span>
                    <i className="blue-dot" />
                    People
                  </span>
                  <span>
                    <i className="mint-dot" />
                    Organizations
                  </span>
                </div>
                <div className="bar-chart">
                  <div className="chart-grid">
                    <span>{max}</span>
                    <span>{Math.round(max / 2)}</span>
                    <span>0</span>
                  </div>
                  {data.months.map((month, index) => (
                    <div className="chart-month" key={month.month + index}>
                      <div className="bars">
                        <div
                          className="bar people"
                          style={{
                            height:
                              Math.max(2, (month.users / max) * 100) + "%",
                          }}
                          title={month.users + " people"}
                        />
                        <div
                          className="bar orgs"
                          style={{
                            height:
                              Math.max(2, (month.organizations / max) * 100) +
                              "%",
                          }}
                          title={month.organizations + " organizations"}
                        />
                      </div>
                      <span>{month.month}</span>
                    </div>
                  ))}
                </div>
              </section>
              <aside className="onboard-card">
                <span className="onboard-symbol">
                  <Icon name="building" size={31} />
                  <span>+</span>
                </span>
                <span className="eyebrow">MAKE ROOM FOR WHAT'S NEXT</span>
                <h3>
                  A new organization.
                  <br />A new beginning.
                </h3>
                <p>
                  Create a workspace and its first administrator in one
                  thoughtful step.
                </p>
                <Button icon="plus" onClick={onCreate}>
                  Onboard organization
                </Button>
                <small>A warm welcome starts here.</small>
              </aside>
            </div>
            <div className="overview-bottom">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recently onboarded</h3>
                    <p>The latest additions to your platform.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => onNavigate("organizations")}
                  >
                    View all <Icon name="arrow" size={15} />
                  </button>
                </div>
                {data.recent.length ? (
                  <OrganizationRows
                    items={data.recent}
                    compact
                    onOpen={onOpen}
                  />
                ) : (
                  <Empty
                    title="Your first organization awaits."
                    text="Build a workspace for your first customer."
                    action={
                      <Button onClick={onCreate}>Onboard organization</Button>
                    }
                  />
                )}
              </section>
              <section className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent activity</h3>
                    <p>The latest changes at a glance.</p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="View activity"
                    onClick={() => onNavigate("activity")}
                  >
                    <Icon name="arrow" size={17} />
                  </button>
                </div>
                <Resource resource={activity}>
                  {(result) =>
                    result.items.length ? (
                      <div className="activity-list">
                        {result.items.map((item) => (
                          <div className="activity-item" key={item.id}>
                            <span className="activity-dot">
                              <Icon
                                name={
                                  item.action.startsWith("user")
                                    ? "users"
                                    : "building"
                                }
                                size={16}
                              />
                            </span>
                            <div>
                              <strong>
                                {actions[item.action] || item.action}
                              </strong>
                              <p>{item.organization_name || item.owner_name}</p>
                              <small>{time(item.created_at)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="quiet-state">
                        <Icon name="clock" size={28} />
                        <p>A fresh start.</p>
                        <small>Your actions will appear here.</small>
                      </div>
                    )
                  }
                </Resource>
              </section>
            </div>
          </>
        );
      }}
    </Resource>
  );
}
function Organizations({ refresh, onOpen, onCreate }) {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1);
  const delayed = useDebounce(q);
  const resource = useResource(
    "/organizations?" + new URLSearchParams({ q: delayed, status, page }),
    refresh,
  );
  return (
    <section className="panel">
      <div className="list-toolbar">
        <Search
          value={q}
          onChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          placeholder="Search organizations, emails or IDs…"
        />
        <div>
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <Button icon="plus" onClick={onCreate}>
            Onboard organization
          </Button>
        </div>
      </div>
      <Resource resource={resource}>
        {(data) => (
          <>
            {data.items.length ? (
              <OrganizationRows items={data.items} onOpen={onOpen} />
            ) : (
              <Empty
                title="No organizations found."
                text="Onboard an organization or adjust your search."
              />
            )}
            <Pager data={data} page={page} setPage={setPage} />
          </>
        )}
      </Resource>
    </section>
  );
}
function People({ organizations, org, setOrg, refresh, onEdit, onCreate }) {
  const [q, setQ] = useState(""),
    [role, setRole] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1);
  const delayed = useDebounce(q);
  const resource = useResource(
    "/users?" +
      new URLSearchParams({
        q: delayed,
        role,
        status,
        page,
        ...(org ? { org_id: org } : {}),
      }),
    refresh,
  );
  return (
    <section className="panel">
      <div className="list-toolbar">
        <Search
          value={q}
          onChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          placeholder="Search people by name or email…"
        />
        <Button icon="plus" onClick={onCreate}>
          Create user
        </Button>
      </div>
      <div className="filter-row">
        <OrgSelect
          organizations={organizations}
          value={org}
          onChange={(value) => {
            setOrg(value);
            setPage(1);
          }}
        />
        <select
          aria-label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {Object.entries(roles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="User access"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All access states</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <Resource resource={resource}>
        {(data) => (
          <>
            {data.items.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Organization</th>
                      <th>Role</th>
                      <th>Access</th>
                      <th>Created</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="identity">
                            <Avatar name={user.name} />
                            <div>
                              <strong>{user.name}</strong>
                              <small>{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {user.organization_name}
                          {user.organization_status === "suspended" && (
                            <small>Workspace suspended</small>
                          )}
                        </td>
                        <td>
                          <span className="role-label">{roles[user.role]}</span>
                        </td>
                        <td>
                          <Pill
                            status={user.disabled ? "disabled" : "active"}
                          />
                        </td>
                        <td className="muted">{date(user.created_at)}</td>
                        <td>
                          <button
                            className="row-action"
                            aria-label={"Edit " + user.name}
                            onClick={() => onEdit(user)}
                          >
                            <Icon name="edit" size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="No people found."
                text="Create a user or try a different filter."
              />
            )}
            <Pager data={data} page={page} setPage={setPage} />
          </>
        )}
      </Resource>
    </section>
  );
}
function Teams({ organizations, org, setOrg, refresh, onEdit, onCreate }) {
  const [page, setPage] = useState(1);
  const resource = useResource(
    "/teams?" + new URLSearchParams({ page, ...(org ? { org_id: org } : {}) }),
    refresh,
  );
  return (
    <>
      <div className="standalone-toolbar">
        <OrgSelect
          organizations={organizations}
          value={org}
          onChange={(value) => {
            setOrg(value);
            setPage(1);
          }}
        />
        <Button icon="plus" onClick={onCreate}>
          Create team
        </Button>
      </div>
      <Resource resource={resource}>
        {(data) => (
          <>
            {data.items.length ? (
              <div className="teams-grid">
                {data.items.map((team) => (
                  <article className="panel team-card" key={team.id}>
                    <div className="team-card-top">
                      <span className="team-icon">
                        <Icon name="layers" size={23} />
                      </span>
                      <button
                        className="icon-button"
                        aria-label={"Edit " + team.name}
                        onClick={() => onEdit(team)}
                      >
                        <Icon name="edit" size={17} />
                      </button>
                    </div>
                    <span className="eyebrow">{team.organization_name}</span>
                    <h3>{team.name}</h3>
                    <div className="team-lead">
                      <Avatar name={team.lead_name} small />
                      <div>
                        <strong>{team.lead_name}</strong>
                        <small>Team lead</small>
                      </div>
                    </div>
                    <div className="team-card-bottom">
                      <div className="avatar-stack">
                        {team.members.slice(0, 5).map((person) => (
                          <Avatar key={person.id} name={person.name} small />
                        ))}
                      </div>
                      <span>{team.members.length} members</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <section className="panel">
                <Empty
                  title="Great teams start with a little structure."
                  text="Create a team lead, then bring their people together."
                />
              </section>
            )}
            <Pager data={data} page={page} setPage={setPage} />
          </>
        )}
      </Resource>
    </>
  );
}
function Activity({ refresh }) {
  const [page, setPage] = useState(1);
  const resource = useResource("/activity?page=" + page, refresh);
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h3>Workspace activity</h3>
          <p>Organization, account and team changes made by platform owners.</p>
        </div>
        <span className="subtle-badge">
          <Icon name="shield" size={14} />
          Append-only record
        </span>
      </div>
      <Resource resource={resource}>
        {(data) => (
          <>
            {data.items.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Details</th>
                      <th>Organization</th>
                      <th>Owner</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="activity-table-title">
                            <Icon name="clock" size={17} />
                            {actions[item.action] || item.action}
                          </span>
                        </td>
                        <td>
                          {item.details.name ||
                            item.details.email ||
                            "Account settings"}
                          {item.details.status && (
                            <small>
                              {item.details.previous_status} →{" "}
                              {item.details.status}
                            </small>
                          )}
                          {item.details.password_changed && (
                            <small>Password updated</small>
                          )}
                        </td>
                        <td>{item.organization_name || "Platform"}</td>
                        <td>{item.owner_name}</td>
                        <td className="muted nowrap">
                          {time(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Nothing to report. Yet."
                text="Changes from this control center will appear here."
              />
            )}
            <Pager data={data} page={page} setPage={setPage} />
          </>
        )}
      </Resource>
    </section>
  );
}
function OrgFields({ value, setValue }) {
  const change = (key, next) => setValue({ ...value, [key]: next });
  return (
    <div className="form-grid">
      <Field
        label="Organization name"
        value={value.name}
        onChange={(e) => change("name", e.target.value)}
        placeholder="e.g. Meridian Realty"
        required
        maxLength={200}
      />
      <Field label="Plan">
        <select
          value={value.plan}
          onChange={(e) => change("plan", e.target.value)}
        >
          {Object.entries(plans).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Contact email"
        type="email"
        value={value.contact_email || ""}
        onChange={(e) => change("contact_email", e.target.value)}
        placeholder="hello@organization.com"
      />
      <Field
        label="Contact phone"
        type="tel"
        maxLength={40}
        value={value.contact_phone}
        onChange={(e) => change("contact_phone", e.target.value)}
        placeholder="+91"
      />
      <Field label="Internal notes">
        <textarea
          rows={3}
          maxLength={5000}
          value={value.notes}
          onChange={(e) => change("notes", e.target.value)}
          placeholder="A little context for your team…"
        />
      </Field>
    </div>
  );
}
function FormFooter({ busy, onClose, label = "Save changes" }) {
  return (
    <footer className="modal-footer">
      <Button secondary type="button" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : label}
      </Button>
    </footer>
  );
}
function OnboardForm({ onSuccess, onClose }) {
  const [organization, setOrganization] = useState({
      name: "",
      plan: "starter",
      contact_email: "",
      contact_phone: "",
      notes: "",
    }),
    [admin, setAdmin] = useState({ name: "", email: "", password: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/organizations", {
        method: "POST",
        body: {
          organization: {
            ...organization,
            contact_email: organization.contact_email || null,
          },
          admin,
        },
      });
      onSuccess(result, admin.password);
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="section-heading">
          <span>01</span>
          <div>
            <h3>Organization details</h3>
            <p>A dedicated workspace for their people and leads.</p>
          </div>
        </div>
        <OrgFields value={organization} setValue={setOrganization} />
        <div className="section-heading">
          <span>02</span>
          <div>
            <h3>The first administrator</h3>
            <p>This person will manage the organization's workspace.</p>
          </div>
        </div>
        <div className="form-grid">
          <Field
            label="Administrator name"
            value={admin.name}
            onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
            required
            maxLength={200}
          />
          <Field
            label="Work email"
            type="email"
            value={admin.email}
            onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
            required
          />
          <div className="full-span">
            <Password
              value={admin.password}
              onChange={(value) => setAdmin({ ...admin, password: value })}
              generate
            />
          </div>
        </div>
        <div className="info-box">
          <Icon name="shield" size={19} />
          <span>
            Organization and administrator IDs are generated automatically. Both
            are created together.
          </span>
        </div>
      </div>
      <FormFooter busy={busy} onClose={onClose} label="Create organization" />
    </form>
  );
}
function UserForm({ user, organizations, initialOrg, onSuccess, onClose }) {
  const [value, setValue] = useState(
      user
        ? { ...user, password: "" }
        : {
            org_id: initialOrg || "",
            name: "",
            email: "",
            password: "",
            role: "tele_caller",
            disabled: false,
          },
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (key, next) => setValue({ ...value, [key]: next });
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = {
      org_id: value.org_id,
      name: value.name,
      email: value.email,
      role: value.role,
      disabled: value.disabled,
      ...(value.password ? { password: value.password } : {}),
    };
    try {
      await api("/users" + (user ? "/" + user.id : ""), {
        method: user ? "PUT" : "POST",
        body,
      });
      onSuccess(user ? "User updated." : "User account created.");
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-grid">
          <Field label="Organization">
            {user ? (
              <input value={user.organization_name} readOnly />
            ) : (
              <OrgSelect
                organizations={organizations}
                value={value.org_id}
                onChange={(next) => change("org_id", next)}
                all={false}
              />
            )}
          </Field>
          <Field label="Role">
            <select
              value={value.role}
              onChange={(e) => change("role", e.target.value)}
            >
              {Object.entries(roles).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Full name"
            value={value.name}
            onChange={(e) => change("name", e.target.value)}
            required
            maxLength={200}
          />
          <Field
            label="Work email"
            type="email"
            value={value.email}
            onChange={(e) => change("email", e.target.value)}
            required
          />
          <div className="full-span">
            <Password
              label={user ? "New password (optional)" : "Initial password"}
              value={value.password}
              onChange={(next) => change("password", next)}
              required={!user}
              generate
            />
          </div>
          {user && (
            <label className="checkbox-field full-span">
              <input
                type="checkbox"
                checked={value.disabled}
                onChange={(e) => change("disabled", e.target.checked)}
              />
              <div>
                <strong>Disable account access</strong>
                <small>
                  Changing credentials or disabling access signs this user out
                  of the app.
                </small>
              </div>
            </label>
          )}
        </div>
      </div>
      <FormFooter
        busy={busy}
        onClose={onClose}
        label={user ? "Save changes" : "Create user"}
      />
    </form>
  );
}
function TeamForm({ team, organizations, initialOrg, onSuccess, onClose }) {
  const [value, setValue] = useState({
      org_id: team?.org_id || initialOrg || "",
      name: team?.name || "",
      lead_id: team?.lead_id || "",
      members: team?.members.map((person) => person.id) || [],
    }),
    [q, setQ] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const delayed = useDebounce(q);
  const people = useResource(
    value.org_id
      ? "/users?" +
          new URLSearchParams({
            org_id: value.org_id,
            status: "active",
            limit: 100,
            q: delayed,
          })
      : null,
  );
  const leads = useResource(
    value.org_id
      ? "/users?" +
          new URLSearchParams({
            org_id: value.org_id,
            status: "active",
            limit: 100,
            role: "team_lead",
          })
      : null,
  );
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/teams" + (team ? "/" + team.id : ""), {
        method: team ? "PUT" : "POST",
        body: value,
      });
      onSuccess(team ? "Team updated." : "Team created.");
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-grid">
          <Field label="Organization">
            {team ? (
              <input value={team.organization_name} readOnly />
            ) : (
              <OrgSelect
                organizations={organizations}
                value={value.org_id}
                onChange={(org_id) =>
                  setValue({ ...value, org_id, lead_id: "", members: [] })
                }
                all={false}
              />
            )}
          </Field>
          <Field
            label="Team name"
            value={value.name}
            onChange={(e) => setValue({ ...value, name: e.target.value })}
            required
            maxLength={200}
          />
          <Field label="Team lead">
            <select
              required
              value={value.lead_id}
              onChange={(e) => setValue({ ...value, lead_id: e.target.value })}
            >
              <option value="">Select a team lead</option>
              {leads.data?.items.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {value.org_id && (
          <>
            <div className="member-heading">
              <h3>Team members</h3>
              <span>{value.members.length} selected · maximum 100</span>
            </div>
            <Search
              value={q}
              onChange={setQ}
              placeholder="Search people in this organization…"
            />
            <div className="member-picker">
              <Resource resource={people}>
                {(data) =>
                  data.items.length ? (
                    data.items.map((person) => (
                      <label className="member-choice" key={person.id}>
                        <input
                          type="checkbox"
                          checked={value.members.includes(person.id)}
                          onChange={(e) =>
                            setValue({
                              ...value,
                              members: e.target.checked
                                ? [...value.members, person.id]
                                : value.members.filter(
                                    (id) => id !== person.id,
                                  ),
                            })
                          }
                        />
                        <Avatar name={person.name} small />
                        <div>
                          <strong>{person.name}</strong>
                          <small>
                            {person.email} · {roles[person.role]}
                          </small>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="muted">
                      No matching active users. Create accounts first.
                    </p>
                  )
                }
              </Resource>
            </div>
          </>
        )}
      </div>
      <FormFooter
        busy={busy || value.members.length > 100}
        onClose={onClose}
        label={team ? "Save team" : "Create team"}
      />
    </form>
  );
}
function OrganizationDetail({
  id,
  refresh,
  onSaved,
  onClose,
  onPeople,
  onCopy,
}) {
  const resource = useResource("/organizations/" + id, refresh);
  return (
    <Resource resource={resource}>
      {(org) => (
        <OrganizationEditor
          key={org.id + org.updated_at}
          org={org}
          onSaved={onSaved}
          onClose={onClose}
          onPeople={onPeople}
          onCopy={onCopy}
        />
      )}
    </Resource>
  );
}
function OrganizationEditor({ org, onSaved, onClose, onPeople, onCopy }) {
  const [value, setValue] = useState(org),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(event, status = value.status) {
    event?.preventDefault();
    if (
      status !== org.status &&
      !window.confirm(
        status === "suspended"
          ? "Suspend " +
              org.name +
              "? All users will be signed out until this workspace is reactivated."
          : "Reactivate " + org.name + "?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api("/organizations/" + org.id, {
        method: "PUT",
        body: { ...value, contact_email: value.contact_email || null, status },
      });
      onSaved("Organization updated.");
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="modal-body">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="org-detail-title">
          <Avatar name={org.name} />
          <div>
            <h3>{org.name}</h3>
            <span className="muted">Onboarded {date(org.created_at)}</span>
          </div>
          <Pill status={org.status} />
        </div>
        <button
          type="button"
          className="id-copy"
          onClick={() => onCopy(org.id)}
        >
          Organization ID <code>{org.id}</code>
          <Icon name="copy" size={16} />
        </button>
        <div className="detail-stats">
          {Object.entries(org.counts).map(([label, value]) => (
            <div key={label}>
              <strong>{count(value)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <OrgFields value={value} setValue={setValue} />
        <div className="org-access">
          <div>
            <strong>Workspace access</strong>
            <p>
              {org.status === "active"
                ? "This organization can sign in and use the app."
                : "App access is paused for this organization."}
            </p>
          </div>
          <Button
            type="button"
            secondary
            danger={org.status === "active"}
            disabled={busy}
            onClick={() =>
              save(null, org.status === "active" ? "suspended" : "active")
            }
          >
            {org.status === "active"
              ? "Suspend workspace"
              : "Reactivate workspace"}
          </Button>
        </div>
        <div className="section-heading">
          <div>
            <h3>People in this workspace</h3>
            <p>
              {org.counts.users} accounts · {org.counts.teams} teams
            </p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => onPeople(org.id)}
          >
            Manage people <Icon name="arrow" size={15} />
          </button>
        </div>
        {org.users.slice(0, 5).map((person) => (
          <div className="detail-person" key={person.id}>
            <Avatar name={person.name} small />
            <div>
              <strong>{person.name}</strong>
              <small>{person.email}</small>
            </div>
            <span className="role-label">{roles[person.role]}</span>
          </div>
        ))}
      </div>
      <FormFooter busy={busy} onClose={onClose} />
    </form>
  );
}
function Credentials({ result, password, onCopy, onClose }) {
  const text =
    "Organization: " +
    result.organization.name +
    "\nOrganization ID: " +
    result.organization.id +
    "\nEmail: " +
    result.admin.email +
    "\nInitial password: " +
    password;
  return (
    <div className="credentials-view">
      <span className="success-symbol">
        <Icon name="check" size={32} />
      </span>
      <h3>They're ready for their next chapter.</h3>
      <p>
        {result.organization.name} and its first administrator are ready. Share
        these sign-in details securely.
      </p>
      <dl>
        <dt>Organization ID</dt>
        <dd>{result.organization.id}</dd>
        <dt>Administrator email</dt>
        <dd>{result.admin.email}</dd>
        <dt>Initial password</dt>
        <dd>{password}</dd>
      </dl>
      <small>The password is shown only during this onboarding.</small>
      <div className="credentials-actions">
        <Button secondary icon="copy" onClick={() => onCopy(text)}>
          Copy sign-in details
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
function Settings({ owner, onSaved }) {
  const [name, setName] = useState(owner.name),
    [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/profile", {
        method: "PUT",
        body: {
          name,
          current_password: current,
          ...(next ? { new_password: next } : {}),
        },
      });
      setCurrent("");
      setNext("");
      onSaved(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="settings-layout">
      <form className="panel settings-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>Owner profile</h3>
            <p>A few details that make this workspace yours.</p>
          </div>
          <Avatar name={owner.name} />
        </div>
        <div className="settings-body">
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <Field
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
          />
          <Field
            label="Email address"
            value={owner.email}
            readOnly
            hint="Owner email is managed by your backend administrator."
          />
          <hr />
          <h3>Account security</h3>
          <Password
            label="Current password"
            value={current}
            onChange={setCurrent}
            current
          />
          <Password
            label="New password (optional)"
            value={next}
            onChange={setNext}
            required={false}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
      <aside className="panel settings-note">
        <span className="stat-icon green">
          <Icon name="shield" size={24} />
        </span>
        <h3>One owner. A clear boundary.</h3>
        <p>
          Your platform-owner account is separate from organization admins and
          app users.
        </p>
        <p>
          Changing your password signs out your other CMS sessions. Your current
          session stays active.
        </p>
        <span className="subtle-badge">Platform owner</span>
      </aside>
    </div>
  );
}
export default function App() {
  const [owner, setOwner] = useState(null),
    [checking, setChecking] = useState(true),
    [loginError, setLoginError] = useState("");
  const [page, setPage] = useState("overview"),
    [refresh, setRefresh] = useState(0),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [org, setOrg] = useState(""),
    [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    api("/auth/me")
      .then(setOwner)
      .catch((error) => {
        if (error.status !== 401) setLoginError(error.message);
      })
      .finally(() => setChecking(false));
    const expired = () => {
      setOwner(null);
      setModal(null);
    };
    window.addEventListener("cms:unauthorized", expired);
    return () => window.removeEventListener("cms:unauthorized", expired);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const summary = useResource(owner ? "/overview" : null, refresh);
  const options = useResource(owner ? "/options" : null, refresh);
  const organizations = options.data?.organizations || [];
  const navigate = (next) => {
    setPage(next);
    setMobileNav(false);
  };
  const close = () => setModal(null);
  const saved = (message) => {
    close();
    setRefresh((x) => x + 1);
    setToast(message);
  };
  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast("Copied to clipboard.");
    } catch {
      setToast("Clipboard unavailable. Please select and copy the details.");
    }
  };
  const openOrg = (id) => setModal({ type: "organization", id });
  if (checking)
    return (
      <div className="boot-screen">
        <Logo />
        <span className="spinner" />
        Opening your workspace…
      </div>
    );
  if (!owner)
    return (
      <Login
        initialError={loginError}
        onLogin={(user) => {
          setOwner(user);
          setLoginError("");
          navigate("overview");
        }}
      />
    );
  const modalTitle =
    modal?.type === "onboard"
      ? "Welcome a new organization."
      : modal?.type === "organization"
        ? "Organization workspace"
        : modal?.type === "credentials"
          ? "Ready to share."
          : modal?.type === "team"
            ? modal.team
              ? "Edit team"
              : "Build a new team."
            : modal?.user
              ? "Manage user account"
              : "Welcome someone new.";
  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={"sidebar " + (mobileNav ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
        >
          <Logo light />
          <span>
            keystone<span className="brand-sub">CONTROL CENTER</span>
          </span>
        </a>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navigation.map(([key, label, icon]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              onClick={() => navigate(key)}
            >
              <Icon name={icon} size={19} />
              {label}
              {key === "organizations" && summary.data && (
                <span className="nav-count">
                  {summary.data.stats.organizations}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="live-indicator" />
            <div>
              <strong>A stronger foundation.</strong>
              <p>One workspace. Every organization.</p>
            </div>
          </div>
          <button
            className={"settings-link " + (page === "settings" ? "active" : "")}
            onClick={() => navigate("settings")}
          >
            <Icon name="settings" size={19} />
            Settings
          </button>
          <button className="owner-block" onClick={() => navigate("settings")}>
            <Avatar name={owner.name} small />
            <span>
              <strong>{owner.name}</strong>
              <small>Platform owner</small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <Icon name="chevron" size={12} />
            <strong>
              {navigation.find((item) => item[0] === page)?.[1] || "Settings"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="owner-tag">
              <Icon name="shield" size={14} />
              Owner access
            </span>
            <button
              className="icon-button"
              aria-label="Refresh data"
              onClick={() => setRefresh((x) => x + 1)}
            >
              <Icon name="refresh" size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  setOwner(null);
                  close();
                } catch (error) {
                  setToast(error.message);
                }
              }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>
        <main className="workspace">
          <div className="page-heading">
            <div>
              <h1>{headings[page][0]}</h1>
              <p>{headings[page][1]}</p>
            </div>
            {page === "overview" && (
              <Button icon="plus" onClick={() => setModal({ type: "onboard" })}>
                Onboard organization
              </Button>
            )}
          </div>
          {options.error && (
            <div className="form-error">
              {options.error}{" "}
              <button className="text-button" onClick={options.reload}>
                Retry
              </button>
            </div>
          )}
          {page === "overview" && (
            <Overview
              summary={summary}
              refresh={refresh}
              onNavigate={navigate}
              onOpen={openOrg}
              onCreate={() => setModal({ type: "onboard" })}
            />
          )}
          {page === "organizations" && (
            <Organizations
              refresh={refresh}
              onOpen={openOrg}
              onCreate={() => setModal({ type: "onboard" })}
            />
          )}
          {page === "users" && (
            <People
              organizations={organizations}
              org={org}
              setOrg={setOrg}
              refresh={refresh}
              onCreate={() => setModal({ type: "user" })}
              onEdit={(user) => setModal({ type: "user", user })}
            />
          )}
          {page === "teams" && (
            <Teams
              organizations={organizations}
              org={org}
              setOrg={setOrg}
              refresh={refresh}
              onCreate={() => setModal({ type: "team" })}
              onEdit={(team) => setModal({ type: "team", team })}
            />
          )}
          {page === "activity" && <Activity refresh={refresh} />}
          {page === "settings" && (
            <Settings
              owner={owner}
              onSaved={(value) => {
                setOwner(value);
                setRefresh((x) => x + 1);
                setToast("Profile updated.");
              }}
            />
          )}
          <footer className="workspace-footer">
            <span>KEYSTONE CONTROL CENTER</span>
            <span>Built for the bigger picture.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          title={modalTitle}
          onClose={close}
          wide={["onboard", "organization", "team"].includes(modal.type)}
        >
          {modal.type === "onboard" && (
            <OnboardForm
              onClose={close}
              onSuccess={(result, password) => {
                setRefresh((x) => x + 1);
                navigate("organizations");
                setModal({ type: "credentials", result, password });
              }}
            />
          )}
          {modal.type === "credentials" && (
            <Credentials
              result={modal.result}
              password={modal.password}
              onCopy={copy}
              onClose={close}
            />
          )}
          {modal.type === "user" && (
            <UserForm
              user={modal.user}
              organizations={organizations}
              initialOrg={org}
              onSuccess={saved}
              onClose={close}
            />
          )}
          {modal.type === "team" && (
            <TeamForm
              team={modal.team}
              organizations={organizations}
              initialOrg={org}
              onSuccess={saved}
              onClose={close}
            />
          )}
          {modal.type === "organization" && (
            <OrganizationDetail
              id={modal.id}
              refresh={refresh}
              onSaved={saved}
              onClose={close}
              onCopy={copy}
              onPeople={(id) => {
                setOrg(id);
                navigate("users");
                close();
              }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
