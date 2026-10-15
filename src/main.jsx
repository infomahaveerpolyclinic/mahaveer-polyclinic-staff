import { Experience, PasswordInput } from "./Experience";
import {
  QueueDesk,
  PaymentsReview,
  DoctorCRM,
  AlertsPage,
  Purchases,
  PharmacyOrders,
  LabExchange,
  Refreshments,
  Insights,
  OperationsSetup,
} from "./OpsPages";
import "./connected.css";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  FlaskConical,
  Pill,
  Package,
  Receipt,
  Activity,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  ArrowUpRight,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  LockKeyhole,
  Plus,
  Headphones,
  MessageSquare,
  ScrollText,
  KeyRound,
} from "lucide-react";
import { api, setCSRF, label } from "./api";
import { OWNER_PORTAL } from "./config";
import {
  Brand,
  Button,
  Field,
  ErrorBox,
  Loading,
  Empty,
} from "./components/ui";
import { PasswordForm } from "./components/AdminForms";
import { InvoiceDetail } from "./components/FinanceForms";
import {
  Dashboard,
  Patients,
  Appointments,
  Doctors,
  Labs,
  Pharmacy,
  Billing,
  Inventory,
  Rehab,
  Requests,
  Reports,
  Catalogs,
  StaffAccess,
  Audit,
  Settings as ClinicSettings,
} from "./pages";
import "./style.css";
const routes = [
  [
    "queue",
    "Live token desk",
    CalendarDays,
    ["owner", "receptionist", "doctor", "physio", "lab", "lab_manager"],
  ],
  ["crm", "My practice & schedule", Activity, ["doctor", "physio"]],
  [
    "payment-review",
    "Verify online payments",
    Receipt,
    ["owner", "receptionist", "accountant", "lab", "lab_manager", "pharmacy"],
  ],
  ["orders", "Pharmacy orders", Pill, ["owner", "pharmacy"]],
  [
    "purchases",
    "Purchase bills & dues",
    Package,
    ["owner", "pharmacy", "inventory", "accountant"],
  ],
  [
    "lab-exchange",
    "Lab exchange",
    FlaskConical,
    ["owner", "lab", "lab_manager"],
  ],
  ["refreshments", "Refreshment counter", Plus, ["owner", "receptionist"]],
  ["insights", "Clinic performance", BarChart3, ["owner", "accountant"]],
  [
    "alerts",
    "Alerts",
    MessageSquare,
    [
      "owner",
      "receptionist",
      "doctor",
      "physio",
      "lab",
      "lab_manager",
      "pharmacy",
      "inventory",
      "accountant",
    ],
  ],
  ["operations", "Operations setup", Settings, ["owner"]],
  [
    "overview",
    "Overview",
    LayoutDashboard,
    [
      "owner",
      "receptionist",
      "doctor",
      "physio",
      "lab",
      "lab_manager",
      "pharmacy",
      "inventory",
      "accountant",
    ],
  ],
  [
    "appointments",
    "Appointments",
    CalendarDays,
    ["owner", "receptionist", "doctor", "physio", "accountant"],
  ],
  [
    "patients",
    "Patients",
    Users,
    [
      "owner",
      "receptionist",
      "doctor",
      "physio",
      "lab",
      "lab_manager",
      "pharmacy",
      "accountant",
    ],
  ],
  [
    "doctors",
    "Doctors & schedules",
    Stethoscope,
    ["owner", "receptionist", "doctor", "physio"],
  ],
  [
    "lab",
    "Laboratory",
    FlaskConical,
    ["owner", "receptionist", "doctor", "physio", "lab", "lab_manager"],
  ],
  ["pharmacy", "Pharmacy", Pill, ["owner", "doctor", "pharmacy"]],
  [
    "rehab",
    "Physiotherapy",
    Activity,
    ["owner", "receptionist", "doctor", "physio"],
  ],
  ["inventory", "Inventory", Package, ["owner", "pharmacy", "inventory"]],
  [
    "billing",
    "Billing & payments",
    Receipt,
    ["owner", "receptionist", "lab", "lab_manager", "pharmacy", "accountant"],
  ],
  ["requests", "Patient enquiries", MessageSquare, ["owner", "receptionist"]],
  ["reports", "Reports & referrals", BarChart3, ["owner", "accountant"]],
  ["catalog", "Clinic catalog", BookOpen, ["owner"]],
  ["users", "Staff & permissions", ShieldCheck, ["owner"]],
  ["audit", "Activity log", ScrollText, ["owner"]],
  ["settings", "Clinic settings", Settings, ["owner"]],
];
const emptyCatalog = {
  doctors: [],
  departments: [],
  tests: [],
  referrers: [],
  suppliers: [],
  items: [],
  programs: [],
};
function Login({ onLogin }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (OWNER_PORTAL && d.user.role !== "owner") {
        setCSRF(d.csrfToken);
        await api("/auth/logout", { method: "POST" });
        throw new Error(
          "This portal is for the clinic owner. Use the care-team website for your staff account.",
        );
      }
      onLogin(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={"login-page " + (OWNER_PORTAL ? "owner-login" : "")}>
      <section className="login-story">
        <Brand subtitle={OWNER_PORTAL ? "OWNER CONSOLE" : "CARE TEAM"} />
        <div>
          <span className="eyebrow">MAHAVEER POLY CLINIC</span>
          <h1>
            {OWNER_PORTAL ? (
              <>
                Every detail.
                <br />
                One clear <em>view.</em>
              </>
            ) : (
              <>
                Connected care.
                <br />
                Starts with <em>you.</em>
              </>
            )}
          </h1>
          <p>
            {OWNER_PORTAL
              ? "Patients, people and performance. A complete view of the clinic you are building."
              : "One patient history. One team. A calmer way to keep every step of care connected."}
          </p>
          <div className="login-feature-grid">
            {[Users, FlaskConical, Pill, Activity].map((I, i) => (
              <div key={i}>
                <I size={24} />
                <span>
                  {["Patients", "Diagnostics", "Pharmacy", "Recovery"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <span className="login-footer">
          DOCTORS · DIAGNOSTICS · PHARMACY · PHYSIOTHERAPY
        </span>
      </section>
      <section className="login-form-section">
        <div className="login-form">
          <span className="login-lock">
            <LockKeyhole size={27} />
          </span>
          <span className="eyebrow">
            {OWNER_PORTAL ? "OWNER SIGN-IN" : "STAFF SIGN-IN"}
          </span>
          <h2>Welcome back.</h2>
          <p>Sign in with your clinic account to continue.</p>
          <form onSubmit={submit}>
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <ErrorBox error={error} />
            <Button busy={busy} className="full">
              Sign in <ArrowUpRight size={17} />
            </Button>
          </form>
          <p className="login-help">
            Need access or a password reset? Contact your clinic owner.
          </p>
        </div>
      </section>
    </div>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [page, setPage] = useState(location.hash.slice(1) || "overview"),
    [version, setVersion] = useState(0),
    [catalog, setCatalog] = useState(emptyCatalog),
    [settings, setSettings] = useState(null),
    [dataError, setDataError] = useState(""),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState(""),
    [invoice, setInvoice] = useState(null),
    [password, setPassword] = useState(false);
  const refresh = () => setVersion((v) => v + 1);
  const notify = (message) => setToast(message);
  useEffect(() => {
    const before = () => {
      document
        .querySelectorAll("dialog.print-target")
        .forEach((d) => d.classList.remove("print-target"));
      const ds = document.querySelectorAll("dialog[open]");
      ds[ds.length - 1]?.classList.add("print-target");
    };
    const after = () =>
      document
        .querySelectorAll("dialog.print-target")
        .forEach((d) => d.classList.remove("print-target"));
    addEventListener("beforeprint", before);
    addEventListener("afterprint", after);
    return () => {
      removeEventListener("beforeprint", before);
      removeEventListener("afterprint", after);
    };
  }, []);
  useEffect(() => {
    api("/auth/me")
      .then((d) => {
        setCSRF(d.csrfToken);
        setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
    api("/public/catalog")
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!user || user.must_change_password) return;
    let alive = true;
    api("/catalog")
      .then((d) => {
        if (alive) {
          setCatalog(d);
          setDataError("");
        }
      })
      .catch((e) => {
        if (alive) {
          setDataError(e.message);
          if (e.status === 401) setUser(null);
        }
      });
    return () => {
      alive = false;
    };
  }, [user, version]);
  useEffect(() => {
    const f = () => setPage(location.hash.slice(1) || "overview");
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const t = setInterval(() => {
      if (
        !document.hidden &&
        !document.querySelector("dialog[open]") &&
        ["overview", "appointments", "lab", "pharmacy"].includes(page)
      )
        refresh();
    }, 45000);
    return () => clearInterval(t);
  }, [page]);
  const navigate = (p) => {
    location.hash = p;
    setPage(p);
    setMobile(false);
    window.scrollTo(0, 0);
  };
  const login = (d) => {
    setCSRF(d.csrfToken);
    setUser(d.user);
    navigate("overview");
  };
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setCSRF("");
      setUser(null);
      setCatalog(emptyCatalog);
    } catch (e) {
      notify(e.message);
    }
  }
  if (checking)
    return (
      <div className="app-boot">
        <Brand />
        <Loading />
      </div>
    );
  if (!user) return <Login onLogin={login} />;
  if (OWNER_PORTAL && user.role !== "owner")
    return (
      <div className="access-denied">
        <Brand subtitle="OWNER CONSOLE" />
        <Empty
          title="Owner access is required"
          text="Your current account belongs to the care team. Sign out to use an owner account."
          action={<Button onClick={logout}>Sign out</Button>}
        />
      </div>
    );
  const allowed = routes.filter(
    (r) =>
      r[3].includes(user.role) &&
      (OWNER_PORTAL ||
        !["catalog", "users", "audit", "settings", "operations"].includes(
          r[0],
        )),
  );
  const active = allowed.some((r) => r[0] === page) ? page : "overview";
  const props = {
    user,
    catalog,
    version,
    refresh,
    notify,
    navigate,
    openInvoice: setInvoice,
  };
  const components = {
    overview: OWNER_PORTAL
      ? Insights
      : ["doctor", "physio"].includes(user.role)
        ? DoctorCRM
        : Dashboard,
    queue: QueueDesk,
    crm: DoctorCRM,
    "payment-review": PaymentsReview,
    orders: PharmacyOrders,
    purchases: Purchases,
    "lab-exchange": LabExchange,
    refreshments: Refreshments,
    insights: Insights,
    alerts: AlertsPage,
    operations: OperationsSetup,
    patients: Patients,
    appointments: Appointments,
    doctors: Doctors,
    lab: Labs,
    pharmacy: Pharmacy,
    billing: Billing,
    inventory: Inventory,
    rehab: Rehab,
    requests: Requests,
    reports: Reports,
    catalog: Catalogs,
    users: StaffAccess,
    audit: Audit,
    settings: ClinicSettings,
  };
  const Current = components[active];
  return (
    <div
      className={"app-shell " + (OWNER_PORTAL ? "owner-shell" : "staff-shell")}
    >
      <a
        href="#workspace"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("workspace").focus();
        }}
      >
        Skip navigation
      </a>
      {mobile && (
        <div className="sidebar-backdrop" onClick={() => setMobile(false)} />
      )}
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <div className="sidebar-brand">
          <Brand subtitle={OWNER_PORTAL ? "OWNER CONSOLE" : "CARE TEAM"} />
          <button
            className="icon-btn mobile-close"
            onClick={() => setMobile(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="clinic-switch">
          <span className="clinic-symbol">
            <Plus size={19} />
          </span>
          <div>
            <strong>Mahaveer Poly Clinic</strong>
            <small>{OWNER_PORTAL ? "Owner workspace" : label(user.role)}</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <span className="nav-section-label">
          {OWNER_PORTAL ? "YOUR CLINIC" : "WORKSPACE"}
        </span>
        <nav>
          {allowed.map(([key, name, Icon], i) => (
            <React.Fragment key={key}>
              {key === "reports" && (
                <span className="nav-section-label secondary-label">
                  MANAGEMENT
                </span>
              )}
              <button
                className={active === key ? "active" : ""}
                onClick={() => navigate(key)}
              >
                <Icon size={18} />
                <span>{name}</span>
                {active === key && <span className="nav-active-dot" />}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <ShieldCheck size={19} />
            <span>
              Connected records.
              <br />
              Thoughtful care.
            </span>
          </div>
          <button onClick={() => setPassword(true)}>
            <KeyRound size={17} /> Change password
          </button>
          <button onClick={logout}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="icon-btn mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              {OWNER_PORTAL ? "Clinic management" : "Care team"}{" "}
              <ChevronRight size={13} />{" "}
              <strong>{allowed.find((r) => r[0] === active)?.[1]}</strong>
            </span>
          </div>
          <div className="top-actions">
            {allowed.some((r) => r[0] === "patients") && (
              <button
                className="find-patient"
                onClick={() => navigate("patients")}
              >
                <Search size={17} />
                <span>Find a patient</span>
              </button>
            )}
            <button
              className="icon-btn refresh-button"
              aria-label="Refresh clinic records"
              onClick={() => {
                refresh();
                notify("Clinic records refreshed");
              }}
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="icon-btn"
              aria-label="Open alerts"
              onClick={() => navigate("alerts")}
            >
              <MessageSquare size={18} />
            </button>
            <span className="top-divider" />
            <span className="avatar user-avatar">{user.name[0]}</span>
            <div className="user-info">
              <strong>{user.name.split(",")[0]}</strong>
              <small>
                {label(user.role)}
                {user.last_login_at
                  ? " · Last sign-in " +
                    new Date(user.last_login_at).toLocaleDateString("en-IN")
                  : ""}
              </small>
            </div>
          </div>
        </header>
        <main className="workspace-main" id="workspace" tabIndex={-1}>
          <ErrorBox error={dataError} />
          {user.must_change_password ? (
            <Empty
              title="Set your own password to continue"
              text="Your account is using a temporary password."
            />
          ) : (
            <Current {...props} owner={OWNER_PORTAL} />
          )}
          <footer className="workspace-footer">
            <span>Mahaveer Poly Clinic</span>
            <span>All times in IST · Amounts in INR</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {invoice && (
        <InvoiceDetail
          id={invoice}
          user={user}
          onClose={() => setInvoice(null)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
      {(password || user.must_change_password) && (
        <PasswordForm
          required={user.must_change_password}
          onClose={() => setPassword(false)}
          onSaved={() => {
            setPassword(false);
            setUser({ ...user, must_change_password: false });
            notify("Password updated");
          }}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <>
    <Experience />
    <App />
  </>,
);
