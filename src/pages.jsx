import { PurchaseForm } from "./OpsPages";
import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Users,
  IndianRupee,
  FlaskConical,
  Package,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Download,
  Clock,
  Activity,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Check,
  Search,
  Stethoscope,
} from "lucide-react";
import { api, money, dateOnly, time, today, label, download } from "./api";
import {
  Button,
  Field,
  Status,
  Empty,
  Loading,
  ErrorBox,
  SearchBox,
  PageHead,
  Table,
  useLoad,
  Stat,
  Details,
  Modal,
} from "./components/ui";
import { CatalogForm, UserForm } from "./components/AdminForms";
import {
  PatientForm,
  PatientRecord,
  ResolveAppointment,
} from "./components/PatientForms";
import {
  NewAppointment,
  AvailabilityForm,
} from "./components/AppointmentForms";
import {
  Encounter,
  LabOrderForm,
  LabDetail,
  RehabForm,
} from "./components/ClinicalForms";
import {
  PharmacySale,
  InvoiceDetail,
  ReceiveStock,
  AdjustStock,
} from "./components/FinanceForms";
export function Dashboard({ user, version, navigate, owner }) {
  const { data, error, loading } = useLoad("/dashboard", version);
  const { data: analytics } = useLoad(
    owner ? "/admin/analytics" : "/dashboard",
    version,
  );
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const clinical = ["doctor", "physio"].includes(user.role);
  return (
    <>
      <PageHead
        eyebrow={owner ? "OWNER OVERVIEW" : "YOUR WORKSPACE"}
        title={
          owner
            ? "A clear view of your clinic."
            : `Hello, ${user.name.split(",")[0]}.`
        }
        description={new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })}
        action={
          <Button
            onClick={() =>
              navigate(
                owner
                  ? "reports"
                  : [
                        "pharmacy",
                        "inventory",
                        "lab",
                        "lab_manager",
                        "accountant",
                      ].includes(user.role)
                    ? {
                        pharmacy: "pharmacy",
                        inventory: "inventory",
                        lab: "lab",
                        lab_manager: "lab",
                        accountant: "billing",
                      }[user.role]
                    : "appointments",
              )
            }
          >
            <ArrowUpRight size={17} />
            {owner
              ? "View reports"
              : [
                    "pharmacy",
                    "inventory",
                    "lab",
                    "lab_manager",
                    "accountant",
                  ].includes(user.role)
                ? "Open worklist"
                : "Open appointments"}
          </Button>
        }
      />
      <div className="stat-grid">
        {data.appointments && (
          <Stat
            title="Today’s appointments"
            value={data.appointments.length}
            detail={`${data.queue || 0} patients in the queue`}
            icon={CalendarDays}
            tone="featured"
          />
        )}
        {data.patient_count !== undefined && (
          <Stat
            title="Registered patients"
            value={data.patient_count}
            detail="All clinic patient records"
            icon={Users}
          />
        )}
        {data.revenue !== undefined && (
          <Stat
            title="Today’s collections"
            value={money(data.revenue)}
            detail="Received payments less refunds"
            icon={IndianRupee}
            tone={data.appointments ? "" : "featured"}
          />
        )}
        {data.requests !== undefined && (
          <Stat
            title="Awaiting confirmation"
            value={data.requests}
            detail="Online appointment requests"
            icon={Clock}
          />
        )}
        {data.lab_pending !== undefined && !data.requests && (
          <Stat
            title="Lab orders in progress"
            value={data.lab_pending}
            detail="Awaiting report release"
            icon={FlaskConical}
          />
        )}
        {data.low_stock && !data.patient_count && (
          <Stat
            title="Stock items to review"
            value={data.low_stock.length}
            detail="At or below reorder level"
            icon={Package}
          />
        )}
        {data.outstanding !== undefined && !owner && (
          <Stat
            title="Outstanding payments"
            value={money(data.outstanding)}
            detail="Department invoice balances"
            icon={IndianRupee}
          />
        )}
      </div>
      {owner && analytics && (
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">CLINIC PERFORMANCE</span>
                <h3>Collections over time</h3>
              </div>
              <span className="muted">Last 30 days</span>
            </div>
            <div className="chart-total">
              {money(
                (analytics.revenue || []).reduce(
                  (s, r) => s + Number(r.revenue_paise),
                  0,
                ),
              )}
              <small>net collected</small>
            </div>
            <RevenueChart points={analytics.trend || []} />
          </section>
          <section className="panel department-panel">
            <div className="panel-head">
              <h3>Collections by department</h3>
              <Activity size={19} />
            </div>
            {["consultation", "lab", "pharmacy", "physio"].map((kind, i) => {
              const v = Number(
                  analytics.revenue?.find((r) => r.kind === kind)
                    ?.revenue_paise || 0,
                ),
                total =
                  analytics.revenue?.reduce(
                    (s, r) => s + Math.max(Number(r.revenue_paise), 0),
                    0,
                  ) || 1;
              return (
                <div className="department-row" key={kind}>
                  <div>
                    <span className={"department-icon tone-" + i}>
                      {React.createElement(
                        [Stethoscope, FlaskConical, Package, Activity][i],
                        { size: 18 },
                      )}
                    </span>
                    <strong>{label(kind)}</strong>
                    <b>{money(v)}</b>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: (Math.max(0, v) / total) * 100 + "%",
                        background: [
                          "#39715c",
                          "#a5bd80",
                          "#dfbd76",
                          "#85aaa6",
                        ][i],
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <button className="link-button" onClick={() => navigate("reports")}>
              Explore financial reports <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                {clinical ? "YOUR CONSULTATIONS" : "TODAY AT MAHAVEER"}
              </span>
              <h3>
                {data.appointments
                  ? "Appointment schedule"
                  : "Your next actions"}
              </h3>
            </div>
            {data.appointments && (
              <Button variant="text" onClick={() => navigate("appointments")}>
                View all <ArrowRight size={15} />
              </Button>
            )}
          </div>
          {data.appointments ? (
            <Table
              rows={data.appointments.slice(0, 7)}
              columns={[
                {
                  title: "Patient",
                  render: (r) => (
                    <div className="cell-person">
                      <span className="avatar">{r.patient_name[0]}</span>
                      <div>
                        <strong>{r.patient_name}</strong>
                        <small>{r.appointment_no}</small>
                      </div>
                    </div>
                  ),
                },
                { title: "Time", render: (r) => time(r.starts_at) },
                { title: "Clinician", key: "doctor_name" },
                { title: "Status", render: (r) => <Status value={r.status} /> },
              ]}
            />
          ) : (
            <div className="quick-actions">
              {(user.role === "pharmacy"
                ? [
                    ["pharmacy", "Open prescriptions"],
                    ["inventory", "Review inventory"],
                    ["billing", "Collect payments"],
                  ]
                : ["lab", "lab_manager"].includes(user.role)
                  ? [
                      ["lab", "Open lab worklist"],
                      ["billing", "Lab invoices"],
                    ]
                  : user.role === "inventory"
                    ? [["inventory", "Receive or adjust stock"]]
                    : [
                        ["billing", "Outstanding invoices"],
                        ["reports", "Collections report"],
                      ]
              ).map(([p, t]) => (
                <button onClick={() => navigate(p)} key={p}>
                  {t}
                  <ArrowUpRight size={19} />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="panel attention-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">KEEP CARE MOVING</span>
              <h3>Needs your attention</h3>
            </div>
            <span className="attention-dot" />
          </div>
          {data.requests > 0 && (
            <button
              onClick={() => navigate("appointments")}
              className="attention-item"
            >
              <span className="attention-icon">
                <CalendarDays size={20} />
              </span>
              <div>
                <strong>{data.requests} booking requests</strong>
                <p>Verify patient details and confirm visits.</p>
              </div>
              <ChevronRight size={17} />
            </button>
          )}
          {data.lab_pending > 0 && (
            <button onClick={() => navigate("lab")} className="attention-item">
              <span className="attention-icon yellow">
                <FlaskConical size={20} />
              </span>
              <div>
                <strong>{data.lab_pending} lab orders in progress</strong>
                <p>Track samples through report release.</p>
              </div>
              <ChevronRight size={17} />
            </button>
          )}
          {data.low_stock?.length > 0 && (
            <button
              onClick={() => navigate("inventory")}
              className="attention-item"
            >
              <span className="attention-icon orange">
                <Package size={20} />
              </span>
              <div>
                <strong>{data.low_stock.length} items low on stock</strong>
                <p>Review quantities and receive new batches.</p>
              </div>
              <ChevronRight size={17} />
            </button>
          )}
          {data.service_requests > 0 && (
            <button
              onClick={() => navigate("requests")}
              className="attention-item"
            >
              <span className="attention-icon">
                <PhoneIcon />
              </span>
              <div>
                <strong>{data.service_requests} patient enquiries</strong>
                <p>Follow up on website requests.</p>
              </div>
              <ChevronRight size={17} />
            </button>
          )}
          <div className="care-note">
            <ShieldCheck size={27} />
            <h4>One patient. One care history.</h4>
            <p>Search an existing patient before registering a new visit.</p>
          </div>
        </section>
      </div>
    </>
  );
}
function PhoneIcon() {
  return <Users size={20} />;
}
function RevenueChart({ points }) {
  const max = Math.max(1, ...points.map((p) => Number(p.amount_paise)));
  return (
    <div className="bar-chart" aria-label="Daily net collections">
      <div className="chart-grid-lines">
        <span />
        <span />
        <span />
      </div>
      {points.length ? (
        points.slice(-30).map((p, i) => (
          <div className="chart-column" key={String(p.day)}>
            <div
              title={dateOnly(p.day) + ": " + money(p.amount_paise)}
              style={{
                height:
                  Math.max(3, (Number(p.amount_paise) / max) * 150) + "px",
              }}
              className={i === points.length - 1 ? "last" : ""}
            />
            <span>
              {new Date(p.day).toLocaleDateString("en-IN", {
                day: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </span>
          </div>
        ))
      ) : (
        <Empty title="No collections in this period" />
      )}
    </div>
  );
}
export function Patients({
  user,
  catalog,
  version,
  notify,
  refresh,
  openInvoice,
}) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [form, setForm] = useState(null),
    [selected, setSelected] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);
  const { data, error, loading } = useLoad(
    "/patients?q=" + encodeURIComponent(search) + "&page=" + page,
    version,
  );
  const saved = () => {
    refresh();
    notify("Patient details saved");
  };
  return (
    <>
      <PageHead
        title="Patients"
        description="Find a returning patient before creating a new record."
        action={
          ["owner", "receptionist"].includes(user.role) && (
            <Button onClick={() => setForm({})}>
              <Plus size={17} /> Register patient
            </Button>
          )
        }
      />
      <div className="panel">
        <div className="toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search name, phone or patient ID"
          />
          <span className="muted">{data?.total || 0} records</span>
        </div>
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data?.rows || []}
            columns={[
              {
                title: "Patient",
                render: (p) => (
                  <div className="cell-person">
                    <span className="avatar">{p.name[0]}</span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.patient_no}</small>
                    </div>
                  </div>
                ),
              },
              { title: "Phone", key: "phone" },
              {
                title: "Date of birth",
                render: (p) => dateOnly(p.date_of_birth),
              },
              { title: "Category", key: "category" },
              {
                title: "",
                render: (p) => (
                  <Button variant="text" onClick={() => setSelected(p.id)}>
                    Open history <ArrowUpRight size={16} />
                  </Button>
                ),
              },
            ]}
          />
        )}
        <div className="pagination">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            variant="secondary"
            disabled={page * 30 >= (data?.total || 0)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      {form && (
        <PatientForm
          patient={form.id ? form : null}
          catalog={catalog}
          onClose={() => setForm(null)}
          onSaved={saved}
        />
      )}
      {selected && (
        <PatientRecord
          id={selected}
          user={user}
          onClose={() => setSelected(null)}
          onInvoice={openInvoice}
          onEdit={(p) => {
            setSelected(null);
            setForm(p);
          }}
        />
      )}
    </>
  );
}
export function Appointments({
  user,
  catalog,
  version,
  notify,
  refresh,
  openInvoice,
}) {
  const [day, setDay] = useState(today()),
    [status, setStatus] = useState(""),
    [form, setForm] = useState(false),
    [resolve, setResolve] = useState(null),
    [encounter, setEncounter] = useState(null),
    [busy, setBusy] = useState(null),
    [err, setErr] = useState("");
  const { data, error, loading } = useLoad(
    `/appointments?${day ? "date=" + day + "&" : ""}${status ? "status=" + status : ""}`,
    version,
  );
  const clinical = ["doctor", "physio"].includes(user.role),
    reception = ["owner", "receptionist"].includes(user.role);
  async function change(a, status) {
    setBusy(a.id);
    setErr("");
    try {
      await api("/appointments/" + a.id, { method: "PATCH", body: { status } });
      refresh();
      notify("Appointment updated");
      if (status === "in_consultation") setEncounter({ ...a, status });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }
  async function bill(a) {
    try {
      const i = await api("/invoices/consultation", {
        method: "POST",
        body: { appointment_id: Number(a.id) },
      });
      refresh();
      openInvoice(i.id);
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <>
      <PageHead
        title={clinical ? "My consultations" : "Appointments"}
        description="Online requests and reception bookings, in one schedule."
        action={
          reception && (
            <Button onClick={() => setForm(true)}>
              <Plus size={17} /> New appointment
            </Button>
          )
        }
      />
      <div className="panel">
        <div className="toolbar">
          <Field
            label="Date (IST)"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                if (e.target.value === "requested") setDay("");
              }}
            >
              <option value="">All statuses</option>
              {[
                "requested",
                "confirmed",
                "arrived",
                "in_consultation",
                "completed",
                "cancelled",
                "no_show",
              ].map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Field>
          <Button
            variant="text"
            onClick={() => {
              setDay("");
              setStatus("");
            }}
          >
            Show all dates
          </Button>
        </div>
        <ErrorBox error={error || err} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data || []}
            columns={[
              {
                title: "Patient",
                render: (a) => (
                  <div>
                    <strong>{a.patient_name}</strong>
                    <small>
                      {a.patient_no || "Needs registration"} ·{" "}
                      {a.appointment_no}
                    </small>
                  </div>
                ),
              },
              {
                title: "Visit",
                render: (a) => (
                  <div>
                    {dateOnly(a.starts_at)}
                    <small>{time(a.starts_at)} IST</small>
                  </div>
                ),
              },
              { title: "Clinician", key: "doctor_name" },
              {
                title: "Source",
                render: (a) => (
                  <span className={"source " + a.source}>
                    {label(a.source)}
                  </span>
                ),
              },
              { title: "Status", render: (a) => <Status value={a.status} /> },
              {
                title: "Actions",
                render: (a) => (
                  <div className="row-actions">
                    {reception && a.status === "requested" && (
                      <Button variant="small" onClick={() => bill(a)}>
                        Collect payment
                      </Button>
                    )}
                    {reception && a.status === "confirmed" && (
                      <Button
                        variant="small"
                        busy={busy === a.id}
                        onClick={() => change(a, "arrived")}
                      >
                        Check in
                      </Button>
                    )}
                    {clinical && a.status === "arrived" && (
                      <Button
                        variant="small"
                        onClick={() => change(a, "in_consultation")}
                      >
                        Start visit
                      </Button>
                    )}
                    {clinical && a.status === "in_consultation" && (
                      <Button variant="small" onClick={() => setEncounter(a)}>
                        Consultation
                      </Button>
                    )}
                    {reception &&
                      a.patient_id &&
                      !["requested", "cancelled", "no_show"].includes(
                        a.status,
                      ) && (
                        <Button variant="text" onClick={() => bill(a)}>
                          View bill
                        </Button>
                      )}
                    {reception &&
                      ["requested", "confirmed", "arrived"].includes(
                        a.status,
                      ) && (
                        <Button
                          variant="text danger"
                          onClick={() => {
                            if (
                              confirm(
                                "Cancel this appointment? The slot will become available again.",
                              )
                            )
                              change(a, "cancelled");
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    {reception &&
                      a.status === "confirmed" &&
                      new Date(a.starts_at) < new Date() && (
                        <Button
                          variant="text"
                          onClick={() => change(a, "no_show")}
                        >
                          No show
                        </Button>
                      )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
      {form && (
        <NewAppointment
          catalog={catalog}
          onClose={() => setForm(false)}
          onSaved={(a) => {
            refresh();
            notify("Appointment reserved. Record payment to issue the token.");
            if (a?.invoice_id) openInvoice(a.invoice_id);
          }}
        />
      )}
      {resolve && (
        <ResolveAppointment
          appointment={resolve}
          catalog={catalog}
          onClose={() => setResolve(null)}
          onSaved={refresh}
        />
      )}
      {encounter && (
        <Encounter
          appointment={encounter}
          catalog={catalog}
          onClose={() => setEncounter(null)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
    </>
  );
}
export function Doctors({ user, catalog, version, refresh, notify }) {
  const [selected, setSelected] = useState(null),
    [add, setAdd] = useState(null),
    [error, setError] = useState("");
  const mine = ["doctor", "physio"].includes(user.role);
  const rows = catalog.doctors.filter(
    (d) => !mine || Number(d.user_id) === Number(user.id),
  );
  const { data: slots, loading } = useLoad(
    "/slots?doctor_id=" + (selected?.id || rows[0]?.id || 1),
    version,
  );
  const d = selected || rows[0];
  async function block(s) {
    try {
      await api("/slots/" + s.id, {
        method: "PATCH",
        body: { available: !s.available },
      });
      refresh();
      notify("Availability updated");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <PageHead
        title={mine ? "My availability" : "Doctors & availability"}
        description="Doctor profiles, qualifications and appointment schedules."
      />
      <div className="doctor-directory">
        {rows.map((d) => (
          <button
            className={
              "doctor-mini " +
              (Number(selected?.id || rows[0]?.id) === Number(d.id)
                ? "selected"
                : "")
            }
            key={d.id}
            onClick={() => setSelected(d)}
          >
            <span className="avatar large">
              {d.name.replace("Dr. ", "")[0]}
            </span>
            <h3>{d.name}</h3>
            <p>{d.specialization}</p>
            <small>{d.qualification}</small>
            <div>{money(d.consultation_fee_paise)} / visit</div>
          </button>
        ))}
      </div>
      {d && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{d.name}</h3>
              <p>
                {d.registration_no
                  ? `Registration: ${d.registration_no}`
                  : "Professional registration not added"}{" "}
                · {d.experience_years} years
              </p>
              {d.referred_by && <p>Introduced by {d.referred_by}</p>}
            </div>
            <Button onClick={() => setAdd(d)}>
              <Plus size={17} /> Add availability
            </Button>
          </div>
          <ErrorBox error={error} />
          {loading ? (
            <Loading />
          ) : (
            <Table
              rows={slots || []}
              columns={[
                { title: "Date", render: (s) => dateOnly(s.starts_at) },
                {
                  title: "Time (IST)",
                  render: (s) => time(s.starts_at) + " to " + time(s.ends_at),
                },
                {
                  title: "Status",
                  render: (s) => (
                    <Status
                      value={
                        s.appointment_id
                          ? "booked"
                          : s.available
                            ? "available"
                            : "blocked"
                      }
                    />
                  ),
                },
                {
                  title: "",
                  render: (s) =>
                    !s.appointment_id &&
                    new Date(s.starts_at) > new Date() && (
                      <Button variant="text" onClick={() => block(s)}>
                        {s.available ? "Block slot" : "Reopen slot"}
                      </Button>
                    ),
                },
              ]}
            />
          )}
        </section>
      )}
      {add && (
        <AvailabilityForm
          doctor={add}
          onClose={() => setAdd(null)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
    </>
  );
}
export function Labs({ user, catalog, version, refresh, notify }) {
  const { data, error, loading } = useLoad("/lab-orders", version),
    [status, setStatus] = useState(""),
    [newOrder, setNewOrder] = useState(false),
    [selected, setSelected] = useState(null);
  return (
    <>
      <PageHead
        title="Laboratory"
        description="Follow every sample from order to reviewed report."
        action={
          <Button onClick={() => setNewOrder(true)}>
            <Plus size={17} /> New lab order
          </Button>
        }
      />
      <div className="lab-counters">
        {[
          "ordered",
          "collected",
          "processing",
          "awaiting_review",
          "released",
        ].map((s) => (
          <button
            key={s}
            className={status === s ? "active" : ""}
            onClick={() => setStatus(status === s ? "" : s)}
          >
            <span>{(data || []).filter((r) => r.status === s).length}</span>
            {label(s)}
          </button>
        ))}
      </div>
      <div className="panel">
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={(data || []).filter((r) => !status || r.status === status)}
            columns={[
              {
                title: "Sample / order",
                render: (r) => (
                  <div>
                    <strong>{r.sample_code}</strong>
                    <small>{dateOnly(r.created_at)}</small>
                  </div>
                ),
              },
              {
                title: "Patient",
                render: (r) => (
                  <div>
                    {r.patient_name}
                    <small>{r.patient_no}</small>
                  </div>
                ),
              },
              {
                title: "Tests",
                render: (r) => r.items.map((i) => i.name).join(", "),
              },
              {
                title: "Referred by",
                render: (r) =>
                  r.doctor_name ||
                  r.external_doctor ||
                  r.referrer_name ||
                  "Self / direct",
              },
              { title: "Status", render: (r) => <Status value={r.status} /> },
              {
                title: "",
                render: (r) => (
                  <Button variant="text" onClick={() => setSelected(r)}>
                    Open order <ArrowUpRight size={16} />
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
      {newOrder && (
        <LabOrderForm
          catalog={catalog}
          onClose={() => setNewOrder(false)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
      {selected && (
        <LabDetail
          order={selected}
          user={user}
          onClose={() => setSelected(null)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
    </>
  );
}
export function Pharmacy({
  user,
  catalog,
  version,
  refresh,
  notify,
  openInvoice,
}) {
  const { data, error, loading } = useLoad("/prescriptions", version),
    [sale, setSale] = useState(null),
    [q, setQ] = useState("");
  const canDispense = ["owner", "pharmacy"].includes(user.role);
  return (
    <>
      <PageHead
        title={canDispense ? "Pharmacy" : "Prescriptions"}
        description="Prescriptions, medicine quantities and the referring clinician."
        action={
          canDispense && (
            <Button onClick={() => setSale({})}>
              <Plus size={17} /> New OTC sale
            </Button>
          )
        }
      />
      <div className="panel">
        <div className="toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search patient or prescriber"
          />
        </div>
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : (
          <div className="rx-list">
            {(data || [])
              .filter((r) =>
                (r.patient_name + " " + r.doctor_name + " " + r.patient_no)
                  .toLowerCase()
                  .includes(q.toLowerCase()),
              )
              .map((r) => (
                <article className="rx-card" key={r.id}>
                  <div className="row-between">
                    <div>
                      <span className="eyebrow">PRESCRIPTION #{r.id}</span>
                      <h3>{r.patient_name}</h3>
                      <p>
                        {r.patient_no} · {r.doctor_name} ·{" "}
                        {dateOnly(r.created_at)}
                      </p>
                    </div>
                    <Status
                      value={
                        r.items.every(
                          (i) =>
                            Number(i.quantity) === Number(i.dispensed_quantity),
                        )
                          ? "dispensed"
                          : "pending"
                      }
                    />
                  </div>
                  <Table
                    rows={r.items}
                    columns={[
                      { title: "Medicine", key: "name" },
                      { title: "Dosage", key: "dosage" },
                      { title: "Frequency", key: "frequency" },
                      { title: "Duration", key: "duration" },
                      { title: "Instructions", key: "instructions" },
                      {
                        title: "Dispensed / prescribed",
                        render: (i) =>
                          `${i.dispensed_quantity} / ${i.quantity}`,
                      },
                    ]}
                  />
                  <p>{r.notes}</p>
                  {canDispense &&
                    r.items.some(
                      (i) => Number(i.quantity) > Number(i.dispensed_quantity),
                    ) && (
                      <div className="form-actions">
                        <Button onClick={() => setSale(r)}>
                          Dispense medicines <ArrowRight size={17} />
                        </Button>
                      </div>
                    )}
                </article>
              ))}
            {!data?.length && (
              <Empty
                title="No prescriptions yet"
                text="Prescriptions issued by clinicians will appear here."
              />
            )}
          </div>
        )}
      </div>
      {sale && (
        <PharmacySale
          catalog={catalog}
          prescription={sale.id ? sale : null}
          onClose={() => setSale(null)}
          onSaved={(i) => {
            refresh();
            notify("Medicines dispensed and invoice created");
            openInvoice(i.id);
          }}
        />
      )}
    </>
  );
}
export function Billing({ user, version, openInvoice }) {
  const [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [kind, setKind] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 200);
    return () => clearTimeout(t);
  }, [q]);
  const { data, error, loading } = useLoad(
    "/invoices?q=" + encodeURIComponent(search) + "&kind=" + kind,
    version,
  );
  const rows = data || [];
  return (
    <>
      <PageHead
        title="Billing & payments"
        description="View historical bills, collect outstanding amounts and print receipts."
      />
      <div className="stat-grid three">
        <Stat
          title="Invoices in this view"
          value={rows.length}
          detail="Up to 200 most recent matching records"
          icon={IndianRupee}
          tone="featured"
        />
        <Stat
          title="Billed amount"
          value={money(rows.reduce((s, i) => s + Number(i.total_paise), 0))}
          detail="Saved invoice totals"
        />
        <Stat
          title="Outstanding"
          value={money(rows.reduce((s, i) => s + Number(i.balance_paise), 0))}
          detail="Pending on these invoices"
        />
      </div>
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search invoice, patient name or patient ID"
          />
          {["owner", "receptionist", "accountant"].includes(user.role) && (
            <select
              aria-label="Department"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="">All departments</option>
              {["consultation", "lab", "pharmacy", "physio"].map((x) => (
                <option key={x} value={x}>
                  {label(x)}
                </option>
              ))}
            </select>
          )}
        </div>
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={rows}
            columns={[
              {
                title: "Invoice",
                render: (r) => (
                  <div>
                    <strong>{r.invoice_no}</strong>
                    <small>{dateOnly(r.created_at)}</small>
                  </div>
                ),
              },
              {
                title: "Patient",
                render: (r) => (
                  <div>
                    {r.patient_name}
                    <small>{r.patient_no}</small>
                  </div>
                ),
              },
              { title: "Department", render: (r) => label(r.kind) },
              {
                title: "Referring doctor",
                render: (r) => r.doctor_name || "Direct",
              },
              { title: "Total", render: (r) => money(r.total_paise) },
              { title: "Balance", render: (r) => money(r.balance_paise) },
              {
                title: "Status",
                render: (r) => <Status value={r.payment_status} />,
              },
              {
                title: "",
                render: (r) => (
                  <Button variant="text" onClick={() => openInvoice(r.id)}>
                    View bill
                  </Button>
                ),
              },
            ]}
          />
        )}
      </section>
    </>
  );
}
export function Inventory({ user, catalog, version, refresh, notify }) {
  const { data, error, loading } = useLoad("/inventory", version),
    [tab, setTab] = useState("Stock summary"),
    [q, setQ] = useState(""),
    [receive, setReceive] = useState(false),
    [adjust, setAdjust] = useState(null);
  const done = (s) => {
    refresh();
    notify(s);
  };
  const items = (data?.items || []).filter((i) =>
    (i.name + " " + i.sku).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHead
        title="Inventory"
        description="Track available stock, batch expiry and every stock movement."
        action={
          <Button onClick={() => setReceive(true)}>
            <Plus size={17} /> Receive stock
          </Button>
        }
      />
      <div className="stat-grid three">
        <Stat
          title="Inventory items"
          value={data?.items.length || 0}
          detail="Medicine and consumable catalog"
          icon={Package}
          tone="featured"
        />
        <Stat
          title="Low stock items"
          value={
            data?.items.filter(
              (i) => Number(i.sellable_stock) <= Number(i.reorder_level),
            ).length || 0
          }
          detail="At or below reorder threshold"
        />
        <Stat
          title="Units expiring within 60 days"
          value={
            data?.items.reduce((s, i) => s + Number(i.expiring_stock), 0) || 0
          }
          detail="Review soon-to-expire batches"
        />
      </div>
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search medicine, stock item or SKU"
          />
        </div>
        <div className="tabs">
          {["Stock summary", "Batches", "Movement ledger"].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : tab === "Stock summary" ? (
          <Table
            rows={items}
            columns={[
              {
                title: "Item",
                render: (i) => (
                  <div>
                    <strong>{i.name}</strong>
                    <small>
                      {i.sku} · {i.generic_name}
                    </small>
                  </div>
                ),
              },
              {
                title: "Sellable",
                render: (i) => (
                  <strong
                    className={
                      Number(i.sellable_stock) <= Number(i.reorder_level)
                        ? "text-warning"
                        : ""
                    }
                  >
                    {i.sellable_stock}
                  </strong>
                ),
              },
              { title: "Expired", key: "expired_stock" },
              { title: "Reorder at", key: "reorder_level" },
              { title: "Price", render: (i) => money(i.selling_price_paise) },
              {
                title: "Prescription",
                render: (i) =>
                  i.prescription_required ? "Required" : "Not required",
              },
            ]}
          />
        ) : tab === "Batches" ? (
          <Table
            rows={(data?.batches || []).filter((b) =>
              b.name.toLowerCase().includes(q.toLowerCase()),
            )}
            columns={[
              { title: "Item", key: "name" },
              { title: "Batch", key: "batch_no" },
              { title: "Supplier", key: "supplier_name" },
              {
                title: "Expiry",
                render: (b) => (
                  <span
                    className={
                      String(b.expires_on).slice(0, 10) < today()
                        ? "text-warning"
                        : ""
                    }
                  >
                    {dateOnly(b.expires_on)}
                  </span>
                ),
              },
              { title: "Quantity", key: "quantity" },
              { title: "Unit cost", render: (b) => money(b.cost_price_paise) },
              {
                title: "",
                render: (b) =>
                  ["owner", "inventory"].includes(user.role) && (
                    <Button variant="text" onClick={() => setAdjust(b)}>
                      Adjust
                    </Button>
                  ),
              },
            ]}
          />
        ) : (
          <Table
            rows={(data?.movements || []).filter((b) =>
              b.name.toLowerCase().includes(q.toLowerCase()),
            )}
            columns={[
              { title: "Date", render: (m) => dateOnly(m.created_at) },
              {
                title: "Item / batch",
                render: (m) => (
                  <div>
                    {m.name}
                    <small>{m.batch_no}</small>
                  </div>
                ),
              },
              { title: "Action", key: "kind" },
              {
                title: "Change",
                render: (m) => (
                  <strong>
                    {Number(m.quantity) > 0 ? "+" : ""}
                    {m.quantity}
                  </strong>
                ),
              },
              { title: "Reason", key: "reason" },
              { title: "Recorded by", key: "actor" },
            ]}
          />
        )}
      </section>
      {receive && (
        <PurchaseForm
          catalog={catalog}
          onClose={() => setReceive(false)}
          onSaved={done}
        />
      )}
      {adjust && (
        <AdjustStock
          batch={adjust}
          onClose={() => setAdjust(null)}
          onSaved={done}
        />
      )}
    </>
  );
}
export function Rehab({ user, catalog, version, refresh, notify }) {
  const { data, error, loading } = useLoad("/rehab", version),
    [plan, setPlan] = useState(null),
    [detail, setDetail] = useState(null);
  const canEdit = ["doctor", "physio"].includes(user.role);
  return (
    <>
      <PageHead
        title="Physiotherapy & rehabilitation"
        description="Keep treatment plans, session notes and progress together."
        action={
          canEdit && (
            <Button onClick={() => setPlan({})}>
              <Plus size={17} /> New care plan
            </Button>
          )
        }
      />
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : (
        <div className="rehab-grid">
          {(data || []).map((r) => (
            <article className="panel rehab-card" key={r.id}>
              <div className="row-between">
                <span className="eyebrow">{r.patient_no}</span>
                <Status value={r.status} />
              </div>
              <h3>{r.patient_name}</h3>
              <p>{r.title}</p>
              <p className="muted">{r.doctor_name}</p>
              <div className="session-progress">
                <strong>
                  {r.completed_sessions}
                  <small> / {r.planned_sessions} sessions</small>
                </strong>
                <div className="progress">
                  <span
                    style={{
                      width:
                        (Number(r.completed_sessions) /
                          Number(r.planned_sessions)) *
                          100 +
                        "%",
                    }}
                  />
                </div>
              </div>
              <div className="row-between">
                <Button variant="text" onClick={() => setDetail(r)}>
                  View progress
                </Button>
                {canEdit && r.status === "active" && (
                  <Button variant="small" onClick={() => setPlan(r)}>
                    Record session
                  </Button>
                )}
              </div>
            </article>
          ))}
          {!data?.length && <Empty title="No treatment plans yet" />}
        </div>
      )}
      {plan && (
        <RehabForm
          plan={plan.id ? plan : null}
          catalog={catalog}
          onClose={() => setPlan(null)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)} wide>
          <h3>{detail.patient_name}</h3>
          <p>{detail.goals}</p>
          <Table
            rows={detail.sessions}
            columns={[
              { title: "Date", render: (s) => dateOnly(s.session_date) },
              { title: "Notes", key: "notes" },
              { title: "Pain score", key: "pain_score" },
              { title: "Invoice ID", key: "invoice_id" },
            ]}
          />
        </Modal>
      )}
    </>
  );
}
export function Requests({ version, refresh, notify }) {
  const { data, error, loading } = useLoad("/requests", version);
  const [err, setErr] = useState("");
  async function change(r, status) {
    try {
      await api("/requests/" + r.id, { method: "PATCH", body: { status } });
      refresh();
      notify("Enquiry updated");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <>
      <PageHead
        title="Patient enquiries"
        description="Website requests for lab tests, pharmacy, physiotherapy and callbacks."
      />
      <section className="panel">
        <ErrorBox error={error || err} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data || []}
            columns={[
              { title: "Received", render: (r) => dateOnly(r.created_at) },
              { title: "Patient", key: "name" },
              {
                title: "Phone",
                render: (r) => <a href={"tel:" + r.phone}>{r.phone}</a>,
              },
              { title: "Service", render: (r) => label(r.service) },
              { title: "Message", key: "message" },
              { title: "Status", render: (r) => <Status value={r.status} /> },
              {
                title: "Update",
                render: (r) => (
                  <select
                    aria-label={"Status for " + r.name}
                    value={r.status}
                    onChange={(e) => change(r, e.target.value)}
                  >
                    {["new", "contacted", "resolved"].map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        )}
      </section>
    </>
  );
}
export function Reports({ user, version, notify }) {
  const [from, setFrom] = useState(
      new Date(Date.now() - 29 * 86400000).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      }),
    ),
    [to, setTo] = useState(today());
  const { data, error, loading } = useLoad(
    "/admin/analytics?from=" + from + "&to=" + to,
    version,
  );
  async function exp(type) {
    try {
      await download("/admin/export/" + type, "mahaveer-" + type + ".csv");
      notify("Export downloaded");
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="CLINIC INTELLIGENCE"
        title="Reports & referrals"
        description="Trace collections, doctor activity and referral sources."
      />
      <section className="panel">
        <div className="toolbar">
          <Field
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Field
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : (
          data && (
            <>
              <div className="report-stats">
                {data.revenue.map((r) => (
                  <Stat
                    key={r.kind}
                    title={label(r.kind)}
                    value={money(r.revenue_paise)}
                    detail={r.transactions + " ledger transactions"}
                  />
                ))}
              </div>
              <RevenueChart points={data.trend} />
              <div className="panel-head">
                <h3>Doctor activity</h3>
                <span className="muted">Billed totals, before collections</span>
              </div>
              <Table
                rows={data.doctors}
                columns={[
                  { title: "Doctor", key: "name" },
                  { title: "Specialty", key: "specialization" },
                  { title: "Booked visits", key: "visits" },
                  { title: "Billed", render: (r) => money(r.billed_paise) },
                ]}
              />
              <div className="panel-head">
                <h3>Referral sources</h3>
                <span className="muted">Patient count is all-time</span>
              </div>
              <Table
                rows={data.referrals}
                rowKey="name"
                columns={[
                  { title: "Source", key: "name" },
                  { title: "Type", key: "kind" },
                  { title: "Patients", key: "patients" },
                  {
                    title: "Billed in period",
                    render: (r) => money(r.billed_paise),
                  },
                ]}
              />
            </>
          )
        )}
      </section>
      {user.role === "owner" && (
        <section className="panel exports">
          <h3>Export clinic records</h3>
          <p>
            CSV exports contain the complete relevant ledger. Amounts are in
            paise.
          </p>
          <div className="action-strip">
            {["patients", "invoices", "stock", "payments", "referrals"].map(
              (t) => (
                <Button key={t} variant="secondary" onClick={() => exp(t)}>
                  <Download size={16} />
                  {label(t)}
                </Button>
              ),
            )}
          </div>
        </section>
      )}
    </>
  );
}
export function Catalogs({ catalog, version, refresh, notify }) {
  const [type, setType] = useState("doctors"),
    [form, setForm] = useState(null);
  const { data: users } = useLoad("/admin/users", version);
  const defs = {
    doctors: [
      ["Name", "name"],
      ["Specialization", "specialization"],
      ["Qualifications", "qualification"],
      ["Introduced by", "referred_by"],
    ],
    departments: [
      ["Name", "name"],
      ["Description", "description"],
    ],
    tests: [
      ["Code", "code"],
      ["Test", "name"],
      ["Sample", "sample_type"],
      ["Category", "category"],
    ],
    items: [
      ["SKU", "sku"],
      ["Item", "name"],
      ["Unit", "unit"],
      ["Type", "kind"],
    ],
    suppliers: [
      ["Name", "name"],
      ["Phone", "phone"],
      ["GSTIN", "gstin"],
    ],
    referrers: [
      ["Name", "name"],
      ["Type", "kind"],
      ["Organization", "organization"],
    ],
    programs: [
      ["Program", "name"],
      ["Category", "category"],
      ["Description", "description"],
    ],
  };
  return (
    <>
      <PageHead
        title="Clinic catalog"
        description="Maintain doctor profiles, services, fees, suppliers and care categories."
        action={
          <Button onClick={() => setForm({})}>
            <Plus size={17} /> Add record
          </Button>
        }
      />
      <section className="panel">
        <div className="tabs wrap">
          {Object.keys(defs).map((t) => (
            <button
              key={t}
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {label(t)}
            </button>
          ))}
        </div>
        <Table
          rows={catalog[type] || []}
          columns={[
            ...defs[type].map(([title, key]) => ({ title, key })),
            {
              title: "",
              render: (r) => (
                <Button variant="text" onClick={() => setForm(r)}>
                  Edit record
                </Button>
              ),
            },
          ]}
        />
      </section>
      {form && (
        <CatalogForm
          type={type}
          record={form.id ? form : null}
          catalog={catalog}
          users={users || []}
          onClose={() => setForm(null)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
    </>
  );
}
export function StaffAccess({ user, version, refresh, notify }) {
  const { data, error, loading } = useLoad("/admin/users", version),
    [form, setForm] = useState(null);
  return (
    <>
      <PageHead
        title="Staff & permissions"
        description="Each account has one role. Access checks also apply on the clinic server."
        action={
          <Button onClick={() => setForm({})}>
            <Plus size={17} /> Add staff account
          </Button>
        }
      />
      <div className="panel">
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data || []}
            columns={[
              {
                title: "Staff member",
                render: (r) => (
                  <div>
                    <strong>{r.name}</strong>
                    <small>{r.email}</small>
                  </div>
                ),
              },
              { title: "Role", render: (r) => label(r.role) },
              {
                title: "Status",
                render: (r) => (
                  <Status value={r.active ? "active" : "inactive"} />
                ),
              },
              {
                title: "Password",
                render: (r) =>
                  r.must_change_password ? "Change required" : "Set",
              },
              {
                title: "",
                render: (r) =>
                  Number(r.id) !== Number(user.id) && (
                    <Button variant="text" onClick={() => setForm(r)}>
                      Manage access
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </div>
      {form && (
        <UserForm
          record={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={(s) => {
            refresh();
            notify(s);
          }}
        />
      )}
    </>
  );
}
export function Audit({ version }) {
  const { data, error, loading } = useLoad("/admin/audit", version);
  return (
    <>
      <PageHead
        title="Activity & audit trail"
        description="Latest 300 recorded sign-ins, patient views and clinic changes."
      />
      <section className="panel">
        <ErrorBox error={error} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data || []}
            columns={[
              {
                title: "When",
                render: (r) => (
                  <div>
                    {dateOnly(r.created_at)}
                    <small>{time(r.created_at)}</small>
                  </div>
                ),
              },
              {
                title: "Team member",
                render: (r) => (
                  <div>
                    {r.actor || "Website visitor"}
                    <small>{label(r.role)}</small>
                  </div>
                ),
              },
              { title: "Action", render: (r) => label(r.action) },
              { title: "Record type", render: (r) => label(r.entity_type) },
              { title: "Record ID", key: "entity_id" },
            ]}
          />
        )}
      </section>
    </>
  );
}
export function Settings({ version, refresh, notify }) {
  const { data, error, loading } = useLoad("/admin/settings", version),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget),
      v = Object.fromEntries(f);
    v.preview_mode = false;
    try {
      await api("/admin/settings", { method: "PATCH", body: v });
      refresh();
      notify("Clinic details updated");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        title="Clinic settings"
        description="These details appear on the patient website."
      />
      <section className="panel settings-panel">
        <ErrorBox error={error || err} />
        {loading ? (
          <Loading />
        ) : (
          <form onSubmit={submit} key={version}>
            <div className="form-grid">
              <Field
                label="Clinic name"
                name="name"
                defaultValue={data.name}
                required
              />
              <Field
                label="Tagline"
                name="tagline"
                defaultValue={data.tagline}
              />
              <Field
                label="Reception phone"
                name="phone"
                defaultValue={data.phone}
              />
              <Field
                label="Clinic email"
                name="email"
                type="email"
                defaultValue={data.email}
              />
            </div>
            <Field label="Clinic address">
              <textarea name="address" rows={3} defaultValue={data.address} />
            </Field>
            <Field
              label="Opening hours"
              name="opening_hours"
              defaultValue={data.opening_hours}
            />
            <p className="muted">
              Appointment and queue dates use Asia/Kolkata.
            </p>
            <div className="form-actions">
              <Button busy={busy}>Save clinic details</Button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
