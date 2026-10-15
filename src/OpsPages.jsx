import React, { useEffect, useState } from "react";
import {
  Bell,
  Clock,
  IndianRupee,
  Users,
  Activity,
  Plus,
  ArrowUpRight,
  Download,
  Check,
  Copy as CopyIcon,
  Package,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { api, API, money, paise, today, dateOnly, time, label } from "./api";
import {
  Button,
  Field,
  Modal,
  PageHead,
  Table,
  Stat,
  Status,
  ErrorBox,
  Empty,
  Loading,
  useLoad,
  PatientPicker,
} from "./components/ui";
function Select({
  label: caption,
  name,
  items,
  blank = "Choose…",
  value,
  onChange,
  required = true,
}) {
  return (
    <Field label={caption}>
      <select name={name} required={required} value={value} onChange={onChange}>
        <option value="">{blank}</option>
        {items.map((i) => (
          <option key={i.id ?? i} value={i.id ?? i}>
            {i.name ?? label(i)}
          </option>
        ))}
      </select>
    </Field>
  );
}
function Confirm({ title, children, onConfirm, onClose, busy }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{children}</p>
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button busy={busy} onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
export async function upload(file, purpose, patientId) {
  if (!file || file.size > 5242880)
    throw new Error("Upload a PDF, JPEG or PNG up to 5 MB.");
  const data = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  return api("/documents", {
    method: "POST",
    body: { filename: file.name, purpose, data, patient_id: patientId || null },
  });
}
function useActions(refresh, notify) {
  const [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn, message = "Saved successfully") => {
    setErr("");
    setBusy(true);
    try {
      const r = await fn();
      refresh?.();
      notify?.(message);
      return r;
    } catch (e) {
      setErr(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { err, busy, run };
}
function Copy({ value }) {
  const [done, set] = useState(false);
  return (
    <button
      className="icon-btn"
      aria-label="Copy reference"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(String(value));
          set(true);
          setTimeout(() => set(false), 1500);
        } catch {}
      }}
    >
      {done ? <Check size={14} /> : <CopyIcon size={14} />}
    </button>
  );
}
export function QueueDesk({
  user,
  version,
  refresh,
  notify,
  openInvoice,
  navigate,
}) {
  const [day, setDay] = useState(today()),
    [confirm, setConfirm] = useState(null);
  const { data, error, loading } = useLoad("/queue?date=" + day, version);
  const actions = useActions(refresh, notify);
  useEffect(() => {
    const t = setInterval(() => !document.hidden && refresh(), 15000);
    return () => clearInterval(t);
  }, []);
  const rows = data || [];
  return (
    <>
      <PageHead
        title="Live token desk"
        description="One daily counter for online and reception registrations. Tokens are issued after full payment."
        action={
          <Button onClick={() => navigate("appointments")}>
            Appointments <ArrowUpRight size={16} />
          </Button>
        }
      />
      <div className="stat-grid four">
        <Stat
          title="Issued today"
          value={rows.length}
          icon={Users}
          tone="featured"
        />
        <Stat
          title="Waiting"
          value={rows.filter((t) => t.status === "waiting").length}
          icon={Clock}
        />
        <Stat
          title="In care"
          value={
            rows.filter((t) => ["called", "serving"].includes(t.status)).length
          }
          icon={Activity}
        />
        <Stat
          title="Completed"
          value={rows.filter((t) => t.status === "done").length}
        />
      </div>
      <div className="panel">
        <div className="toolbar">
          <Field
            label="Queue date"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <span className="muted">Refreshes every 15 seconds · IST</span>
        </div>
        <ErrorBox error={error || actions.err} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={rows}
            columns={[
              {
                title: "Token",
                render: (t) => (
                  <strong className="queue-number">
                    {String(t.number).padStart(2, "0")}
                  </strong>
                ),
              },
              {
                title: "Patient",
                render: (t) => (
                  <div>
                    {t.patient_name}
                    <small>{t.patient_no}</small>
                  </div>
                ),
              },
              { title: "Scheduled", render: (t) => time(t.scheduled_at) },
              {
                title: "Service / doctor",
                render: (t) => (
                  <div>
                    {t.doctor_name || label(t.service)}
                    <small>{t.reason}</small>
                  </div>
                ),
              },
              { title: "Status", render: (t) => <Status value={t.status} /> },
              {
                title: "Actions",
                render: (t) => (
                  <div className="row-actions">
                    {["waiting", "called", "skipped"].includes(t.status) && (
                      <Button
                        variant="small"
                        onClick={() =>
                          setConfirm({
                            id: t.id,
                            action:
                              t.status === "skipped"
                                ? "recall"
                                : t.status === "waiting"
                                  ? "call"
                                  : "skip",
                            number: t.number,
                          })
                        }
                      >
                        {t.status === "skipped"
                          ? "Recall"
                          : t.status === "waiting"
                            ? "Call token"
                            : "Skip"}
                      </Button>
                    )}
                    {t.status === "called" && !t.appointment_id && (
                      <Button
                        variant="small"
                        onClick={() =>
                          setConfirm({
                            id: t.id,
                            action: "complete",
                            number: t.number,
                          })
                        }
                      >
                        Complete
                      </Button>
                    )}
                    {["owner", "receptionist", "lab", "lab_manager"].includes(
                      user.role,
                    ) && (
                      <Button
                        variant="text"
                        onClick={() => openInvoice(t.invoice_id)}
                      >
                        Bill
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
      {confirm && (
        <Confirm
          title={`${label(confirm.action)} token ${confirm.number}?`}
          onClose={() => setConfirm(null)}
          busy={actions.busy}
          onConfirm={async () => {
            const ok = await actions.run(
              () =>
                api("/queue/" + confirm.id + "/action", {
                  method: "POST",
                  body: { action: confirm.action },
                }),
              "Queue updated",
            );
            if (ok) setConfirm(null);
          }}
        >
          The queue will update across the clinic and patient account.
        </Confirm>
      )}
    </>
  );
}
export function PaymentsReview({
  user,
  version,
  refresh,
  notify,
  openInvoice,
}) {
  const { data, error, loading } = useLoad("/payment-submissions", version);
  const [selected, setSelected] = useState(null),
    [note, setNote] = useState("");
  const a = useActions(refresh, notify);
  return (
    <>
      <PageHead
        title="Payment verification"
        description="Match each UPI reference and amount against the clinic bank account before approval."
      />
      <div className="panel">
        <ErrorBox error={error || a.err} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data || []}
            columns={[
              { title: "Patient", key: "patient_name" },
              {
                title: "Invoice",
                render: (r) => (
                  <Button
                    variant="text"
                    onClick={() => openInvoice(r.invoice_id)}
                  >
                    {r.invoice_no}
                  </Button>
                ),
              },
              { title: "Amount", render: (r) => money(r.amount_paise) },
              {
                title: "Transaction",
                render: (r) => (
                  <>
                    {r.reference}
                    <Copy value={r.reference} />
                  </>
                ),
              },
              { title: "Submitted", render: (r) => dateOnly(r.created_at) },
              { title: "Status", render: (r) => <Status value={r.status} /> },
              {
                title: "Review",
                render: (r) =>
                  r.status === "pending" ? (
                    <div className="row-actions">
                      <Button
                        variant="small"
                        onClick={() => {
                          setSelected({ ...r, approved: true });
                          setNote("");
                        }}
                      >
                        Verify
                      </Button>
                      <Button
                        variant="text danger"
                        onClick={() => {
                          setSelected({ ...r, approved: false });
                          setNote("");
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    r.review_note
                  ),
              },
            ]}
          />
        )}
      </div>
      {selected && (
        <Modal
          title={
            selected.approved
              ? "Confirm settled payment"
              : "Reject payment reference"
          }
          onClose={() => setSelected(null)}
        >
          <p>
            {selected.patient_name} · {money(selected.amount_paise)} ·{" "}
            {selected.reference}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await a.run(
                () =>
                  api("/payment-submissions/" + selected.id + "/review", {
                    method: "POST",
                    body: { approved: selected.approved, note },
                  }),
                "Payment review recorded",
              );
              if (ok) setSelected(null);
            }}
          >
            <Field
              label="Verification / rejection note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              minLength={3}
              required
            />
            {selected.approved && (
              <label className="checkbox">
                <input type="checkbox" required />I checked the clinic account
                and confirm this payment was received.
              </label>
            )}
            <ErrorBox error={a.err} />
            <Button busy={a.busy}>
              {selected.approved
                ? "Confirm payment & issue eligible token"
                : "Reject submission"}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function DoctorCRM({
  user,
  catalog,
  version,
  refresh,
  notify,
  navigate,
}) {
  const [day, setDay] = useState(today()),
    [did, setDid] = useState(String(catalog.doctors[0]?.id || "")),
    [form, setForm] = useState(false),
    [patient, setPatient] = useState(null);
  const { data, error, loading } = useLoad(
    "/doctor/crm?date=" +
      day +
      (user.role === "owner" ? "&doctor_id=" + did : ""),
    version,
  );
  const a = useActions(refresh, notify);
  return (
    <>
      <PageHead
        title="My practice"
        description="Today’s care, collected revenue, referrals and schedule."
        action={
          <Button onClick={() => setForm(true)}>
            Record referral <Plus size={16} />
          </Button>
        }
      />
      <div className="toolbar">
        <Field
          label="Date"
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
        {user.role === "owner" && (
          <Select
            label="Doctor"
            items={catalog.doctors}
            value={did}
            onChange={(e) => setDid(e.target.value)}
          />
        )}
      </div>
      <ErrorBox error={error || a.err} />
      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stat-grid four">
              <Stat
                title="Scheduled patients"
                value={data.stats.appointments}
                icon={Users}
                tone="featured"
              />
              <Stat
                title="Patients seen"
                value={data.stats.completed}
                icon={Activity}
              />
              <Stat
                title="Collected revenue"
                value={money(data.stats.received_paise)}
                icon={IndianRupee}
              />
              <Stat title="Referrals made" value={data.stats.referrals} />
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h3>My schedule · {dateOnly(day)}</h3>
                <Button variant="text" onClick={() => navigate("appointments")}>
                  Open consultations
                </Button>
              </div>
              <Table
                rows={data.schedule}
                columns={[
                  {
                    title: "Time",
                    render: (r) => time(r.starts_at) + "–" + time(r.ends_at),
                  },
                  {
                    title: "Patient",
                    render: (r) => r.patient_name || "Available",
                  },
                  { title: "Token", render: (r) => r.token_number || "—" },
                  { title: "Purpose", key: "reason" },
                  {
                    title: "Status",
                    render: (r) => (
                      <Status
                        value={
                          r.status || (r.available ? "available" : "blocked")
                        }
                      />
                    ),
                  },
                ]}
              />
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h3>Consultation fee</h3>
                <strong>{money(data.doctor?.consultation_fee_paise)}</strong>
              </div>
              {(data.doctor?.can_edit_fee || user.role === "owner") && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    a.run(
                      () =>
                        api("/doctors/" + data.doctor.id + "/fee", {
                          method: "PATCH",
                          body: { consultation_fee_paise: paise(f.get("fee")) },
                        }),
                      "Fee updated for new bookings",
                    );
                  }}
                >
                  <div className="inline-form">
                    <Field
                      label="New fee (₹)"
                      name="fee"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={
                        Number(data.doctor?.consultation_fee_paise || 0) / 100
                      }
                    />
                    <Button busy={a.busy}>Update fee</Button>
                  </div>
                  <p className="muted">
                    Previously issued bills keep their saved prices.
                  </p>
                </form>
              )}
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h3>Referrals</h3>
              </div>
              <Table
                rows={data.referrals}
                columns={[
                  { title: "Patient", key: "patient_name" },
                  { title: "Service", key: "service" },
                  { title: "Destination", key: "destination" },
                  { title: "Notes", key: "notes" },
                ]}
              />
            </div>
          </>
        )
      )}
      {form && (
        <Modal
          title="Record a clinical referral"
          onClose={() => setForm(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!patient) return;
              const f = new FormData(e.currentTarget);
              const ok = await a.run(
                () =>
                  api("/referrals", {
                    method: "POST",
                    body: {
                      patient_id: Number(patient.id),
                      service: f.get("service"),
                      destination: f.get("destination"),
                      notes: f.get("notes"),
                    },
                  }),
                "Referral recorded",
              );
              if (ok) setForm(false);
            }}
          >
            <PatientPicker value={patient} onChange={setPatient} />
            <Select
              label="Service"
              name="service"
              items={["consultation", "lab", "pharmacy", "physio", "external"]}
            />
            <Field
              label="Destination / clinician"
              name="destination"
              required
            />
            <Field label="Referral notes">
              <textarea name="notes" />
            </Field>
            <ErrorBox error={a.err} />
            <Button busy={a.busy} disabled={!patient}>
              Save referral
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function AlertsPage({ version, refresh, notify, user }) {
  const [tab, setTab] = useState("active");
  const { data, error, loading } = useLoad(
    tab === "active" ? "/alerts" : "/alerts/definitions",
    version,
  );
  return (
    <>
      <PageHead
        title="Clinic alerts"
        description="Events and operational reminders from your connected clinic."
      />
      <div className="tabs">
        <button
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          Active alerts
        </button>
        <button
          className={tab === "definitions" ? "active" : ""}
          onClick={() => setTab("definitions")}
        >
          Message catalog {user.role === "owner" ? "· 80 definitions" : ""}
        </button>
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : (
        <div className="alert-grid">
          {(data || []).map((r, i) => (
            <article
              className={"alert-card alert-" + r.severity}
              key={r.id || r.code}
            >
              <div className="row-between">
                <span className="status">
                  {label(r.category)} · {label(r.severity)}
                </span>
                {r.created_at && (
                  <small>
                    {dateOnly(r.created_at)} {time(r.created_at)}
                  </small>
                )}
              </div>
              <h3>{r.title}</h3>
              <p>{r.detail || r.message}</p>
              {r.created_at && !r.read_at && (
                <Button
                  variant="text"
                  onClick={async () => {
                    try {
                      await api("/alerts/" + r.id + "/read", {
                        method: "POST",
                      });
                      refresh();
                    } catch (e) {
                      notify(e.message);
                    }
                  }}
                >
                  Mark read <Check size={14} />
                </Button>
              )}
              {r.read_at && <small>Read</small>}
              {tab === "definitions" && <code>{r.code}</code>}
            </article>
          ))}
          {!data?.length && (
            <Empty
              title="No alerts"
              text="New clinic events and due reminders appear here."
            />
          )}
        </div>
      )}
    </>
  );
}
export function Purchases({
  user,
  catalog,
  version,
  refresh,
  notify,
  navigate,
}) {
  const { data, error, loading } = useLoad("/purchases", version),
    [form, setForm] = useState(false),
    [payment, setPayment] = useState(null);
  const a = useActions(refresh, notify);
  return (
    <>
      <PageHead
        title="Purchase bills & supplier dues"
        description="Every stock receipt links to an invoice, supplier, batch, expiry and cost."
        action={
          ["owner", "pharmacy", "inventory"].includes(user.role) && (
            <Button onClick={() => setForm(true)}>
              <Plus size={16} />
              Receive against bill
            </Button>
          )
        }
      />
      <div className="stat-grid three">
        <Stat title="Purchase bills" value={data?.length || 0} />
        <Stat
          title="Outstanding suppliers"
          value={money(
            (data || []).reduce((s, b) => s + Number(b.balance_paise), 0),
          )}
          icon={IndianRupee}
          tone="featured"
        />
        <Stat
          title="Overdue bills"
          value={
            (data || []).filter(
              (b) => b.due_date < today() && Number(b.balance_paise) > 0,
            ).length
          }
          icon={Clock}
        />
      </div>
      <div className="panel">
        <ErrorBox error={error || a.err} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data || []}
            columns={[
              {
                title: "Supplier / bill",
                render: (b) => (
                  <div>
                    <strong>{b.supplier_name}</strong>
                    <small>
                      {b.bill_number} · {dateOnly(b.bill_date)}
                    </small>
                  </div>
                ),
              },
              {
                title: "Batches",
                render: (b) => (
                  <details>
                    <summary>{b.lines.length} line(s)</summary>
                    {b.lines.map((l) => (
                      <p key={l.id}>
                        {l.name} · {l.batch_no} · {l.quantity} units · expires{" "}
                        {dateOnly(l.expires_on)} · cost{" "}
                        {money(l.cost_price_paise)} · sale{" "}
                        {money(l.selling_price_paise)}
                      </p>
                    ))}
                  </details>
                ),
              },
              { title: "Due", render: (b) => dateOnly(b.due_date) },
              {
                title: "Bill / balance",
                render: (b) => (
                  <div>
                    {money(b.total_paise)}
                    <small>{money(b.balance_paise)} outstanding</small>
                  </div>
                ),
              },
              {
                title: "Document",
                render: (b) => (
                  <a
                    className="text-link"
                    href={API + "/documents/" + b.document_id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Supplier invoice ↗
                  </a>
                ),
              },
              {
                title: "Action",
                render: (b) =>
                  ["owner", "accountant"].includes(user.role) &&
                  Number(b.balance_paise) > 0 && (
                    <Button variant="small" onClick={() => setPayment(b)}>
                      Record payment
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </div>
      {form && (
        <PurchaseForm
          catalog={catalog}
          onClose={() => setForm(false)}
          onSaved={() => {
            refresh();
            notify("Supplier bill saved and stock received.");
          }}
        />
      )}
      {payment && (
        <Modal
          title={"Pay supplier · " + payment.bill_number}
          onClose={() => setPayment(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = await a.run(
                () =>
                  api("/purchases/" + payment.id + "/payments", {
                    method: "POST",
                    body: {
                      amount_paise: paise(f.get("amount")),
                      method: f.get("method"),
                      reference: f.get("reference") || "",
                      idempotency_key: crypto.randomUUID(),
                    },
                  }),
                "Supplier payment recorded",
              );
              if (ok) setPayment(null);
            }}
          >
            <Field
              label="Amount paid (₹)"
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              max={Number(payment.balance_paise) / 100}
              defaultValue={Number(payment.balance_paise) / 100}
              required
            />
            <Select
              label="Payment method"
              name="method"
              items={["cash", "upi", "bank", "card"]}
            />
            <Field
              label="Payment reference (required for non-cash)"
              name="reference"
            />
            <label className="checkbox">
              <input type="checkbox" required />
              This payment has been completed.
            </label>
            <ErrorBox error={a.err} />
            <Button busy={a.busy}>Record payment</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function PurchaseForm({ catalog, onClose, onSaved }) {
  const [lines, setLines] = useState([
    {
      item_id: "",
      batch_no: "",
      expires_on: "",
      quantity: 1,
      cost: 0,
      selling: 0,
    },
  ]);
  const a = useActions(null, null);
  const change = (n, k, v) =>
    setLines((ls) => ls.map((l, i) => (i === n ? { ...l, [k]: v } : l)));
  return (
    <Modal title="Receive stock against a supplier bill" onClose={onClose} wide>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const ok = await a.run(async () => {
            const doc = await upload(f.get("document"), "supplier_bill");
            return api("/purchases", {
              method: "POST",
              body: {
                supplier_id: Number(f.get("supplier_id")),
                bill_number: f.get("bill_number"),
                bill_date: f.get("bill_date"),
                due_date: f.get("due_date"),
                document_id: doc.id,
                lines: lines.map((l) => ({
                  item_id: Number(l.item_id),
                  batch_no: l.batch_no,
                  expires_on: l.expires_on,
                  quantity: Number(l.quantity),
                  cost_price_paise: paise(l.cost),
                  selling_price_paise: paise(l.selling),
                })),
              },
            });
          });
          if (ok) {
            onSaved();
            onClose();
          }
        }}
      >
        <div className="form-grid">
          <Select
            label="Supplier"
            name="supplier_id"
            items={catalog.suppliers}
          />
          <Field label="Supplier bill number" name="bill_number" required />
          <Field
            label="Bill date"
            name="bill_date"
            type="date"
            max={today()}
            required
            defaultValue={today()}
          />
          <Field
            label="Payment due date"
            name="due_date"
            type="date"
            required
            defaultValue={today()}
          />
        </div>
        <Field label="Supplier bill (required PDF, PNG or JPEG, up to 5 MB)">
          <input
            name="document"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            required
          />
        </Field>
        {lines.map((l, n) => (
          <fieldset className="purchase-line" key={n}>
            <legend>Batch {n + 1}</legend>
            <div className="form-grid">
              <Select
                label="Inventory item"
                items={catalog.items.filter((i) => i.active)}
                value={l.item_id}
                onChange={(e) => change(n, "item_id", e.target.value)}
              />
              <Field
                label="Batch number"
                value={l.batch_no}
                onChange={(e) => change(n, "batch_no", e.target.value)}
                required
              />
              <Field
                label="Expiry date"
                type="date"
                min={today()}
                value={l.expires_on}
                onChange={(e) => change(n, "expires_on", e.target.value)}
                required
              />
              <Field
                label="Quantity"
                type="number"
                min="1"
                value={l.quantity}
                onChange={(e) => change(n, "quantity", e.target.value)}
                required
              />
              <Field
                label="Purchase cost / unit (₹, inclusive)"
                type="number"
                min="0"
                step="0.01"
                value={l.cost}
                onChange={(e) => change(n, "cost", e.target.value)}
                required
              />
              <Field
                label="Selling price / unit (₹, before tax)"
                type="number"
                min="0"
                step="0.01"
                value={l.selling}
                onChange={(e) => change(n, "selling", e.target.value)}
                required
              />
            </div>
            {lines.length > 1 && (
              <Button
                type="button"
                variant="text danger"
                onClick={() => setLines((ls) => ls.filter((_, i) => i !== n))}
              >
                Remove line
              </Button>
            )}
          </fieldset>
        ))}
        <Button
          variant="secondary"
          type="button"
          onClick={() =>
            setLines([
              ...lines,
              {
                item_id: "",
                batch_no: "",
                expires_on: "",
                quantity: 1,
                cost: 0,
                selling: 0,
              },
            ])
          }
        >
          Add batch line
        </Button>
        <p className="purchase-total">
          Bill total{" "}
          {money(
            lines.reduce((s, l) => s + Number(l.quantity) * paise(l.cost), 0),
          )}
        </p>
        <ErrorBox error={a.err} />
        <label className="checkbox">
          <input type="checkbox" required />
          The supplier bill and the received batch details match.
        </label>
        <Button busy={a.busy}>Save bill & receive stock</Button>
      </form>
    </Modal>
  );
}
export function PharmacyOrders({ version, refresh, notify, openInvoice }) {
  const { data, error, loading } = useLoad("/pharmacy/orders", version),
    [selected, setSelected] = useState(null);
  const a = useActions(refresh, notify);
  const next = (o) =>
    ({
      requested: ["accept", "reject"],
      accepted: ["packing"],
      packing:
        o.delivery_mode === "delivery"
          ? ["out_for_delivery"]
          : ["ready_for_pickup"],
      out_for_delivery: ["delivered"],
      ready_for_pickup: ["collected"],
    })[o.status] || [];
  return (
    <>
      <PageHead
        title="Pharmacy orders & delivery"
        description="Review prescriptions, allocate unexpired stock, collect payment, then dispatch."
      />
      <ErrorBox error={error || a.err} />
      {loading ? (
        <Loading />
      ) : (
        <div className="ops-order-grid">
          {(data || []).map((o) => (
            <article className="panel order-panel" key={o.id}>
              <div className="row-between">
                <span className="eyebrow">ORDER #{o.id}</span>
                <Status value={o.status} />
              </div>
              <h3>{o.patient_name}</h3>
              <p>
                {o.phone} · {label(o.delivery_mode)}
              </p>
              {o.delivery_address && (
                <p className="info-box">{o.delivery_address}</p>
              )}
              <Table
                rows={o.items}
                columns={[
                  { title: "Medicine", key: "name" },
                  { title: "Qty", key: "quantity" },
                  { title: "Stock", key: "sellable_stock" },
                ]}
              />
              {o.referral_note && <p>Referred by: {o.referral_note}</p>}
              {o.prescription_document_id && (
                <a
                  className="text-link"
                  href={API + "/documents/" + o.prescription_document_id}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open prescription ↗
                </a>
              )}
              {o.invoice_id && (
                <Button
                  variant="text"
                  onClick={() => openInvoice(o.invoice_id)}
                >
                  Invoice · {money(o.total_paise)} · {money(o.balance_paise)}{" "}
                  due
                </Button>
              )}
              <div className="form-actions">
                {next(o).map((action) => (
                  <Button
                    variant={action === "reject" ? "text danger" : "small"}
                    key={action}
                    onClick={() => setSelected({ ...o, action })}
                  >
                    {label(action)}
                  </Button>
                ))}
              </div>
              {o.tracking_reference && <p>Tracking: {o.tracking_reference}</p>}
            </article>
          ))}
          {!data?.length && (
            <Empty
              title="No pharmacy orders yet"
              text="Patient checkout requests appear here."
            />
          )}
        </div>
      )}
      {selected && (
        <Modal
          title={label(selected.action) + " order #" + selected.id}
          onClose={() => setSelected(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = await a.run(
                () =>
                  api("/pharmacy/orders/" + selected.id + "/action", {
                    method: "POST",
                    body: {
                      action: selected.action,
                      note: f.get("note"),
                      prescription_verified: f.get("verified") === "on",
                      tracking_reference: f.get("tracking") || "",
                    },
                  }),
                "Order updated",
              );
              if (ok) setSelected(null);
            }}
          >
            <p>
              {selected.patient_name} · {label(selected.delivery_mode)}
            </p>
            {selected.action === "accept" &&
              selected.prescription_document_id && (
                <label className="checkbox">
                  <input name="verified" type="checkbox" required />I reviewed
                  the uploaded prescription, patient and medicine quantities,
                  and confirm it is valid.
                </label>
              )}
            <Field
              label="Review / action note"
              name="note"
              minLength={3}
              required
            />
            <Field
              label="Delivery tracking reference (optional)"
              name="tracking"
            />
            <ErrorBox error={a.err} />
            <Button busy={a.busy}>
              Confirm {label(selected.action).toLowerCase()}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function LabExchange({
  version,
  refresh,
  notify,
  openInvoice,
  navigate,
}) {
  const { data, error, loading } = useLoad("/lab-orders", version),
    [selected, setSelected] = useState(null),
    [events, setEvents] = useState([]);
  const a = useActions(refresh, notify);
  async function open(o) {
    setSelected(o);
    try {
      setEvents(await api("/lab-orders/" + o.id + "/sample-events"));
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <>
      <PageHead
        title="Laboratory exchange & collections"
        description="Track partner referrals, sample handovers and home collections."
        action={
          <Button onClick={() => navigate("lab")}>
            Create lab order <Plus size={16} />
          </Button>
        }
      />
      <div className="panel">
        <ErrorBox error={error || a.err} />
        {loading ? (
          <Loading />
        ) : (
          <Table
            rows={data || []}
            columns={[
              {
                title: "Sample",
                render: (o) => (
                  <div>
                    <strong>{o.sample_code}</strong>
                    <small>{o.patient_name}</small>
                  </div>
                ),
              },
              {
                title: "Lab partner",
                render: (o) => o.partner_name || "Internal clinic",
              },
              { title: "Direction", render: (o) => label(o.direction) },
              {
                title: "Collection",
                render: (o) => (
                  <div>
                    {label(o.collection_mode)}
                    <small>{o.collection_address}</small>
                  </div>
                ),
              },
              {
                title: "Reference / transport",
                render: (o) => (
                  <div>
                    {o.partner_reference}
                    <small>{o.transport_note}</small>
                  </div>
                ),
              },
              { title: "Status", render: (o) => <Status value={o.status} /> },
              {
                title: "Payment",
                render: (o) =>
                  o.invoice_id && (
                    <Button
                      variant="text"
                      onClick={() => openInvoice(o.invoice_id)}
                    >
                      {Number(o.balance_paise) > 0
                        ? money(o.balance_paise) + " due"
                        : "Paid"}
                    </Button>
                  ),
              },
              {
                title: "Tracking",
                render: (o) => (
                  <Button variant="small" onClick={() => open(o)}>
                    Sample ledger
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
      {selected && (
        <Modal
          title={"Sample ledger · " + selected.sample_code}
          onClose={() => setSelected(null)}
          wide
        >
          {selected.report_document_id && (
            <p>
              <a
                href={API + "/documents/" + selected.report_document_id}
                target="_blank"
                rel="noreferrer"
              >
                Download partner report
              </a>
            </p>
          )}
          {selected.status !== "released" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const file = e.currentTarget.elements.report.files[0];
                const result = await a.run(async () => {
                  const doc = await upload(
                    file,
                    "lab_attachment",
                    Number(selected.patient_id),
                  );
                  await api("/lab-orders/" + selected.id + "/report-document", {
                    method: "POST",
                    body: { document_id: Number(doc.id) },
                  });
                  return doc;
                }, "Report attached for review. Payment and independent review still required.");
                if (result) {
                  setSelected({ ...selected, report_document_id: result.id });
                  setEvents(
                    await api("/lab-orders/" + selected.id + "/sample-events"),
                  );
                }
              }}
            >
              <Field label="Partner report (PDF, JPEG or PNG)">
                <input
                  type="file"
                  name="report"
                  required
                  accept="application/pdf,image/png,image/jpeg"
                />
              </Field>
              <Button busy={a.busy}>Attach for review</Button>
            </form>
          )}
          <Table
            rows={events}
            columns={[
              { title: "Event", key: "event" },
              { title: "Notes", key: "notes" },
              { title: "By", key: "actor" },
              {
                title: "When",
                render: (e) =>
                  dateOnly(e.created_at) + " " + time(e.created_at),
              },
            ]}
          />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = await a.run(
                () =>
                  api("/lab-orders/" + selected.id + "/sample-events", {
                    method: "POST",
                    body: { event: f.get("event"), notes: f.get("notes") },
                  }),
                "Sample event recorded",
              );
              if (ok)
                setEvents(
                  await api("/lab-orders/" + selected.id + "/sample-events"),
                );
            }}
          >
            <Select
              label="Handover event"
              name="event"
              items={[
                "received",
                "dispatched",
                "rejected",
                "recollection_requested",
                "partner_report_received",
              ]}
            />
            <Field label="Tracking / temperature / transport / handover notes">
              <textarea name="notes" minLength={3} required />
            </Field>
            <ErrorBox error={a.err} />
            <Button busy={a.busy}>Add to sample ledger</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Refreshments({ version, refresh, notify, openInvoice }) {
  const { data, error, loading } = useLoad("/refreshments", version),
    [cart, setCart] = useState({}),
    [confirm, setConfirm] = useState(null);
  const a = useActions(refresh, notify);
  const total = (data || []).reduce(
    (s, p) => s + Number(p.price_paise) * (cart[p.id] || 0),
    0,
  );
  return (
    <>
      <PageHead
        title="Reception refreshments"
        description="Prices and products are managed by the admin. Confirm cash or settled online payment before selling."
      />
      <ErrorBox error={error || a.err} />
      <div className="refreshment-layout">
        <div className="refreshment-grid">
          {loading ? (
            <Loading />
          ) : (
            (data || []).map((p) => (
              <article className="panel refreshment-product" key={p.id}>
                {p.image_url && <img src={p.image_url} alt={p.name} />}
                <h3>{p.name}</h3>
                <strong>{money(p.price_paise)}</strong>
                <p>{p.stock} in stock</p>
                <Field
                  label="Quantity"
                  type="number"
                  min="0"
                  max={p.stock}
                  value={cart[p.id] || 0}
                  onChange={(e) =>
                    setCart({ ...cart, [p.id]: Number(e.target.value) })
                  }
                />
              </article>
            ))
          )}
          {!loading && !data?.length && (
            <Empty
              title="No refreshments yet"
              text="The admin can add products, prices and stock in Operations setup."
            />
          )}
        </div>
        <form
          className="panel refreshment-checkout"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setConfirm({
              items: Object.entries(cart)
                .filter(([, q]) => q > 0)
                .map(([id, q]) => ({ id: Number(id), quantity: q })),
              method: f.get("method"),
              reference: f.get("reference") || "",
              idempotency_key: crypto.randomUUID(),
            });
          }}
        >
          <span className="eyebrow">CURRENT SALE</span>
          <h2>{money(total)}</h2>
          <Select
            label="Payment method"
            name="method"
            items={["cash", "upi", "card", "bank"]}
          />
          <Field label="Transaction reference (non-cash)" name="reference" />
          <Button disabled={total <= 0}>Review payment & sell</Button>
        </form>
      </div>
      {confirm && (
        <Confirm
          title={"Confirm payment of " + money(total) + "?"}
          busy={a.busy}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const r = await a.run(
              () =>
                api("/refreshments/sales", { method: "POST", body: confirm }),
              "Paid sale recorded",
            );
            if (r) {
              setCart({});
              setConfirm(null);
              openInvoice(r.id);
            }
          }}
        >
          Confirm that you have received the cash or verified the online
          payment. This records the sale and reduces stock.
        </Confirm>
      )}
    </>
  );
}
export function Insights({ version, refresh, notify }) {
  const [from, setFrom] = useState(today().slice(0, 8) + "01"),
    [to, setTo] = useState(today()),
    [expense, setExpense] = useState(false);
  const { data, error, loading } = useLoad(
    `/ops/analytics?from=${from}&to=${to}`,
    version,
  );
  const exp = useLoad("/ops/expenses", version);
  const a = useActions(refresh, notify);
  const received = (data?.sales || []).reduce(
    (s, x) => s + Number(x.received_paise),
    0,
  );
  const max = Math.max(
    1,
    ...(data?.trend || []).map((r) => Number(r.received_paise)),
  );
  return (
    <>
      <PageHead
        title="Clinic performance"
        description="Cash received, supplier payments, operating expenses and outstanding balances."
        action={
          <Button onClick={() => setExpense(true)}>
            <Plus size={16} />
            Record expense
          </Button>
        }
      />
      <div className="toolbar">
        <Field
          label="From (IST)"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Field
          label="To (IST)"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <ErrorBox error={error || a.err} />
      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stat-grid four">
              <Stat
                title="Net collections"
                value={money(received)}
                detail="Payments minus refunds in range"
                tone="featured"
                icon={IndianRupee}
              />
              <Stat
                title="Operating expenses"
                value={money(data.expenses_paise)}
                detail="Recorded miscellaneous expenses"
              />
              <Stat
                title="Supplier payments"
                value={money(data.supplier_paid_paise)}
                detail="Purchase payments in range"
              />
              <Stat
                title="Net cash movement"
                value={money(
                  received - data.expenses_paise - data.supplier_paid_paise,
                )}
                detail="Collections less expenses and supplier payments; not accounting profit"
              />
            </div>
            <div className="ops-two-column">
              <div className="panel">
                <div className="panel-heading">
                  <h3>Daily collections</h3>
                  <span className="muted">INR</span>
                </div>
                {data.trend.length ? (
                  <div
                    className="revenue-chart"
                    role="img"
                    aria-label="Daily net collected payments"
                  >
                    {data.trend.map((t) => (
                      <div key={t.day} className="chart-column">
                        <span>{money(t.received_paise)}</span>
                        <div
                          style={{
                            height: Math.max(
                              2,
                              (Number(t.received_paise) / max) * 155,
                            ),
                          }}
                        />
                        <small>{String(t.day).slice(5)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="No collections in this range"
                    text="The chart appears when payments are recorded."
                  />
                )}
              </div>
              <div className="panel">
                <div className="panel-heading">
                  <h3>Service collections</h3>
                </div>
                <Table
                  rows={data.sales}
                  columns={[
                    { title: "Service", render: (r) => label(r.kind) },
                    { title: "Transactions", key: "transactions" },
                    {
                      title: "Net received",
                      render: (r) => money(r.received_paise),
                    },
                  ]}
                />
              </div>
            </div>
            <div className="stat-grid three">
              <Stat
                title="Patient balances"
                value={money(data.receivable_paise)}
                detail="All outstanding invoices"
              />
              <Stat
                title="Supplier balances"
                value={money(data.supplier_outstanding_paise)}
                detail="All unpaid purchase bills"
              />
              <Stat
                title="Stock at cost"
                value={money(data.stock_cost_paise)}
                detail="Includes expired stock awaiting disposal"
              />
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h3>Doctor performance</h3>
              </div>
              <Table
                rows={data.doctors}
                columns={[
                  { title: "Doctor", key: "name" },
                  { title: "Completed visits", key: "completed" },
                  { title: "Referrals", key: "referrals" },
                  {
                    title: "Attributed collections",
                    render: (r) => money(r.received_paise),
                  },
                ]}
              />
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h3>Doctor pharmacy buyers</h3>
              </div>
              <Table
                rows={data.buyers}
                columns={[
                  { title: "Doctor buyer", key: "name" },
                  { title: "Bills", key: "invoices" },
                  {
                    title: "Discounts",
                    render: (r) => money(r.discount_paise),
                  },
                  { title: "Billed", render: (r) => money(r.billed_paise) },
                ]}
              />
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h3>Expense ledger</h3>
              </div>
              <Table
                rows={exp.data || []}
                columns={[
                  { title: "Date", render: (r) => dateOnly(r.expense_date) },
                  { title: "Category", key: "category" },
                  { title: "Description", key: "description" },
                  { title: "Amount", render: (r) => money(r.amount_paise) },
                  { title: "Reference", key: "reference" },
                ]}
              />
            </div>
          </>
        )
      )}
      {expense && (
        <Modal title="Record clinic expense" onClose={() => setExpense(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = await a.run(
                () =>
                  api("/ops/expenses", {
                    method: "POST",
                    body: {
                      category: f.get("category"),
                      description: f.get("description"),
                      amount_paise: paise(f.get("amount")),
                      expense_date: f.get("date"),
                      reference: f.get("reference"),
                    },
                  }),
                "Expense recorded",
              );
              if (ok) setExpense(false);
            }}
          >
            <Field label="Category" name="category" required />
            <Field label="Description" name="description" required />
            <Field
              label="Amount (₹)"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
            <Field
              label="Expense date"
              name="date"
              type="date"
              defaultValue={today()}
              required
            />
            <Field label="Reference" name="reference" />
            <ErrorBox error={a.err} />
            <Button busy={a.busy}>Save expense</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
const setupFields = {
  partners: [
    ["name", "Lab name"],
    ["contact_name", "Contact name"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["address", "Address"],
    ["registration_no", "Registration number"],
    ["active", "Active", "checkbox"],
  ],
  refreshments: [
    ["name", "Product name"],
    ["price_paise", "Price (₹)", "money"],
    ["stock", "Stock quantity", "number"],
    ["image_url", "Image URL (HTTPS, optional)"],
    ["active", "Active", "checkbox"],
  ],
};
export function OperationsSetup({ catalog, version, refresh, notify }) {
  const [tab, setTab] = useState("settings"),
    [editor, setEditor] = useState(null);
  const info = useLoad("/ops/catalog", version),
    settings = useLoad("/ops/settings", version),
    notifications = useLoad("/ops/notifications", version);
  const a = useActions(refresh, notify);
  return (
    <>
      <PageHead
        title="Operations setup"
        description="Shared payment settings, partner laboratories, refreshments and patient notifications."
      />
      <div className="tabs">
        {[
          ["settings", "Payments & queue"],
          ["partners", "Lab partners"],
          ["refreshments", "Refreshments"],
          ["collections", "Collection windows"],
          ["prices", "Partner prices"],
          ["notifications", "WhatsApp log"],
        ].map(([key, title]) => (
          <button
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
            key={key}
          >
            {title}
          </button>
        ))}
      </div>
      <ErrorBox
        error={a.err || info.error || settings.error || notifications.error}
      />
      {tab === "settings" && settings.data && (
        <div className="panel settings-panel">
          <form
            key={version}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(
                () =>
                  api("/ops/settings", {
                    method: "PATCH",
                    body: {
                      upi_id: f.get("upi_id"),
                      upi_payee: f.get("upi_payee"),
                      about_text: f.get("about_text"),
                      reminder_ahead: Number(f.get("reminder_ahead")),
                      average_visit_minutes: Number(
                        f.get("average_visit_minutes"),
                      ),
                      doctor_discount_bps: paise(f.get("discount")),
                    },
                  }),
                "Shared settings updated",
              );
            }}
          >
            <div className="form-grid">
              <Field
                label="Clinic UPI ID"
                name="upi_id"
                defaultValue={settings.data.upi_id}
              />
              <Field
                label="UPI payee name"
                name="upi_payee"
                defaultValue={settings.data.upi_payee}
              />
              <Field
                label="Remind when patients ahead ≤"
                name="reminder_ahead"
                type="number"
                min="1"
                max="20"
                required
                defaultValue={settings.data.reminder_ahead}
              />
              <Field
                label="Fallback consultation duration (minutes)"
                name="average_visit_minutes"
                type="number"
                min="1"
                max="120"
                required
                defaultValue={settings.data.average_visit_minutes}
              />
              <Field
                label="Verified doctor buyer discount (%)"
                name="discount"
                type="number"
                step="0.01"
                min="0"
                max="50"
                required
                defaultValue={Number(settings.data.doctor_discount_bps) / 100}
              />
            </div>
            <Field label="About the clinic">
              <textarea
                name="about_text"
                rows={6}
                defaultValue={settings.data.about_text}
              />
            </Field>
            <p className="muted">
              QR codes are generated from your UPI ID. Patient-submitted
              references always require staff verification.
            </p>
            <Button busy={a.busy}>Save shared settings</Button>
          </form>
        </div>
      )}
      {["partners", "refreshments"].includes(tab) && (
        <div className="panel">
          <div className="panel-heading">
            <h3>{label(tab)}</h3>
            <Button onClick={() => setEditor({ type: tab, record: null })}>
              <Plus size={15} />
              Add {tab === "partners" ? "partner" : "product"}
            </Button>
          </div>
          <Table
            rows={info.data?.[tab] || []}
            columns={
              tab === "partners"
                ? [
                    { title: "Name", key: "name" },
                    { title: "Contact", key: "contact_name" },
                    { title: "Phone", key: "phone" },
                    { title: "Registration", key: "registration_no" },
                    {
                      title: "Active",
                      render: (r) => (r.active ? "Yes" : "No"),
                    },
                    {
                      title: "",
                      render: (r) => (
                        <Button
                          variant="text"
                          onClick={() => setEditor({ type: tab, record: r })}
                        >
                          Edit
                        </Button>
                      ),
                    },
                  ]
                : [
                    { title: "Product", key: "name" },
                    { title: "Price", render: (r) => money(r.price_paise) },
                    { title: "Stock", key: "stock" },
                    {
                      title: "Active",
                      render: (r) => (r.active ? "Yes" : "No"),
                    },
                    {
                      title: "",
                      render: (r) => (
                        <Button
                          variant="text"
                          onClick={() => setEditor({ type: tab, record: r })}
                        >
                          Edit
                        </Button>
                      ),
                    },
                  ]
            }
          />
        </div>
      )}
      {tab === "collections" && (
        <div className="panel">
          <h3>Publish a home collection window</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(
                () =>
                  api("/ops/collection-slots", {
                    method: "POST",
                    body: {
                      starts_at:
                        f.get("date") + "T" + f.get("start") + ":00+05:30",
                      ends_at: f.get("date") + "T" + f.get("end") + ":00+05:30",
                      capacity: Number(f.get("capacity")),
                    },
                  }),
                "Collection availability published",
              );
            }}
          >
            <div className="form-grid">
              <Field
                label="Date (IST)"
                name="date"
                type="date"
                min={today()}
                required
              />
              <Field
                label="Capacity"
                name="capacity"
                type="number"
                min="1"
                max="100"
                required
              />
              <Field label="Starts (IST)" name="start" type="time" required />
              <Field label="Ends (IST)" name="end" type="time" required />
            </div>
            <Button busy={a.busy}>Add collection window</Button>
          </form>
          <Table
            rows={info.data?.collection_slots || []}
            columns={[
              { title: "Date", render: (r) => dateOnly(r.starts_at) },
              {
                title: "Time",
                render: (r) => time(r.starts_at) + "–" + time(r.ends_at),
              },
              { title: "Capacity", key: "capacity" },
            ]}
          />
        </div>
      )}
      {tab === "prices" && (
        <div className="panel">
          <h3>Partner test pricing</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await a.run(
                () =>
                  api("/ops/partner-prices", {
                    method: "POST",
                    body: {
                      partner_id: Number(f.get("partner")),
                      test_id: Number(f.get("test")),
                      price_paise: paise(f.get("price")),
                    },
                  }),
                "Partner price saved",
              );
            }}
          >
            <div className="form-grid">
              <Select
                label="Partner laboratory"
                name="partner"
                items={info.data?.partners || []}
              />
              <Select label="Test" name="test" items={catalog.tests} />
              <Field
                label="Agreed inbound price (₹)"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
            <Button busy={a.busy}>Save price</Button>
          </form>
          <Table
            rows={info.data?.partner_prices || []}
            rowKey="test_id"
            columns={[
              { title: "Partner", key: "partner_name" },
              { title: "Test", key: "test_name" },
              { title: "Agreed price", render: (r) => money(r.price_paise) },
            ]}
          />
        </div>
      )}
      {tab === "notifications" && (
        <div className="panel">
          <div className="info-box">
            {notifications.data?.configured
              ? "WhatsApp credentials configured. Review individual delivery status below."
              : "WhatsApp credentials have not been configured. Messages are not being sent."}
          </div>
          <Table
            rows={notifications.data?.rows || []}
            columns={[
              { title: "Patient", key: "patient_name" },
              { title: "Update", render: (r) => label(r.event) },
              { title: "Status", render: (r) => <Status value={r.status} /> },
              { title: "Attempts", key: "attempts" },
              { title: "Provider code", key: "error_code" },
              {
                title: "Queued",
                render: (r) =>
                  dateOnly(r.created_at) + " " + time(r.created_at),
              },
              {
                title: "Action",
                render: (r) =>
                  ["failed", "blocked"].includes(r.status) && (
                    <Button
                      variant="text"
                      onClick={() =>
                        a.run(
                          () =>
                            api("/ops/notifications/" + r.id + "/retry", {
                              method: "POST",
                            }),
                          "Notification queued for retry",
                        )
                      }
                    >
                      Retry
                    </Button>
                  ),
              },
            ]}
          />
        </div>
      )}
      {editor && (
        <Modal
          title={(editor.record ? "Edit " : "Add ") + label(editor.type)}
          onClose={() => setEditor(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                body = {};
              for (const [k, , kind] of setupFields[editor.type])
                body[k] =
                  kind === "checkbox"
                    ? f.get(k) === "on"
                    : kind === "money"
                      ? paise(f.get(k))
                      : kind === "number"
                        ? Number(f.get(k))
                        : f.get(k) || "";
              const ok = await a.run(
                () =>
                  api(
                    "/ops/catalog/" +
                      editor.type +
                      (editor.record ? "/" + editor.record.id : ""),
                    { method: editor.record ? "PUT" : "POST", body },
                  ),
                "Catalog updated",
              );
              if (ok) setEditor(null);
            }}
          >
            {setupFields[editor.type].map(([key, title, kind]) =>
              kind === "checkbox" ? (
                <label key={key} className="checkbox">
                  <input
                    type="checkbox"
                    name={key}
                    defaultChecked={editor.record?.[key] ?? true}
                  />
                  {title}
                </label>
              ) : (
                <Field
                  key={key}
                  label={title}
                  name={key}
                  type={["money", "number"].includes(kind) ? "number" : "text"}
                  min="0"
                  step={kind === "money" ? "0.01" : "1"}
                  required={["name", "phone", "stock", "price_paise"].includes(
                    key,
                  )}
                  defaultValue={
                    kind === "money"
                      ? Number(editor.record?.[key] || 0) / 100
                      : editor.record?.[key] || ""
                  }
                />
              ),
            )}
            <ErrorBox error={a.err} />
            <Button busy={a.busy}>Save</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
