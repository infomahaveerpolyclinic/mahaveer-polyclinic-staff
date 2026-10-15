import React, { useState } from "react";
import { api, paise, money, dateOnly, time } from "../api";
import {
  Modal,
  Button,
  Field,
  ErrorBox,
  PatientPicker,
  Table,
  Status,
  Details,
  Loading,
  useLoad,
} from "./ui";
export function PharmacySale({ catalog, prescription, onClose, onSaved }) {
  const [patient, setPatient] = useState(
      prescription
        ? {
            id: prescription.patient_id,
            name: prescription.patient_name,
            patient_no: prescription.patient_no,
          }
        : null,
    ),
    [lines, setLines] = useState(
      prescription
        ? prescription.items
            .filter((i) => i.quantity > i.dispensed_quantity)
            .map((i) => ({
              item_id: String(i.item_id),
              quantity: i.quantity - i.dispensed_quantity,
            }))
        : [{ item_id: "", quantity: 1 }],
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (n, k, v) =>
    setLines(lines.map((l, i) => (i === n ? { ...l, [k]: v } : l)));
  const total = lines.reduce(
    (s, l) =>
      s +
      Number(
        catalog.items.find((i) => String(i.id) === l.item_id)
          ?.selling_price_paise || 0,
      ) *
        Number(l.quantity),
    0,
  );
  async function submit(e) {
    e.preventDefault();
    if (!patient) {
      setError("Choose a patient.");
      return;
    }
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const buyer = Number(f.get("buyer_doctor_id")) || null;
      const r = await api(buyer ? "/pharmacy/doctor-sale" : "/pharmacy/sales", {
        method: "POST",
        body: {
          patient_id: Number(patient.id),
          ...(buyer ? { buyer_doctor_id: buyer } : {}),
          prescription_id: prescription?.id || null,
          doctor_id: Number(f.get("doctor_id")) || null,
          referrer_id: Number(f.get("referrer_id")) || null,
          items: lines.map((l) => ({
            item_id: Number(l.item_id),
            quantity: Number(l.quantity),
          })),
        },
      });
      onSaved(r);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        prescription
          ? "Dispense prescription #" + prescription.id
          : "New pharmacy sale"
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        {prescription ? (
          <div className="info-box">
            <strong>
              {prescription.patient_name} · {prescription.patient_no}
            </strong>
            <p>Prescribed by {prescription.doctor_name}</p>
          </div>
        ) : (
          <>
            <PatientPicker value={patient} onChange={setPatient} />
            <div className="form-grid">
              <Field label="Referring doctor">
                <select name="doctor_id">
                  <option value="">Self / direct</option>
                  {catalog.doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Referral source">
                <select name="referrer_id">
                  <option value="">None</option>
                  {catalog.referrers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="muted">
              Prescription-only medicines must be dispensed from a clinician’s
              prescription in the Prescriptions list.
            </p>
          </>
        )}
        {!prescription && (
          <Field label="Doctor buyer (separate from referring doctor)">
            <select name="buyer_doctor_id">
              <option value="">Regular customer</option>
              {catalog.doctors
                .filter((d) => d.active)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        {lines.map((l, n) => (
          <div className="sale-line" key={n}>
            <Field label="Medicine">
              <select
                required
                value={l.item_id}
                onChange={(e) => update(n, "item_id", e.target.value)}
              >
                {!prescription && <option value="">Select medicine</option>}
                {catalog.items
                  .filter(
                    (i) =>
                      i.kind === "medicine" &&
                      i.active &&
                      (!prescription ||
                        prescription.items.some(
                          (p) => Number(p.item_id) === Number(i.id),
                        )),
                  )
                  .map((i) => (
                    <option value={i.id} key={i.id}>
                      {i.name} · Stock {i.sellable_stock} ·{" "}
                      {money(i.selling_price_paise)}
                    </option>
                  ))}
              </select>
            </Field>
            <Field
              label="Quantity"
              type="number"
              min="1"
              max="10000"
              required
              value={l.quantity}
              onChange={(e) => update(n, "quantity", e.target.value)}
            />
            <Button
              type="button"
              variant="text danger"
              onClick={() => setLines(lines.filter((_, i) => i !== n))}
            >
              Remove
            </Button>
          </div>
        ))}
        {!prescription && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => setLines([...lines, { item_id: "", quantity: 1 }])}
          >
            Add item
          </Button>
        )}
        <div className="total-line">
          <span>Subtotal before any applicable tax</span>
          <strong>{money(total)}</strong>
        </div>
        <p className="muted">
          The clinic server checks prescription limits and allocates unexpired
          batches by earliest expiry. Payment is recorded after the invoice is
          created.
        </p>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy} disabled={!lines.length}>
            Dispense & create invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function InvoiceDetail({ id, user, onClose, onSaved }) {
  const [version, setVersion] = useState(0),
    { data, error, loading } = useLoad("/invoices/" + id, version),
    [busy, setBusy] = useState(false),
    [payError, setPayError] = useState(""),
    [mode, setMode] = useState("payment");
  const [key, setKey] = useState(() => crypto.randomUUID());
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setPayError("");
    try {
      await api("/invoices/" + id + "/payments", {
        method: "POST",
        body: {
          amount_paise: paise(f.get("amount")),
          method: f.get("method"),
          reference: f.get("reference"),
          reason: f.get("reason") || "",
          kind: mode,
          idempotency_key: key,
        },
      });
      setKey(crypto.randomUUID());
      setVersion((v) => v + 1);
      onSaved("Payment ledger updated");
    } catch (e) {
      setPayError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={data?.invoice.invoice_no || "Invoice"} onClose={onClose} wide>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} />
      ) : (
        <>
          <div className="print-brand">
            <img
              className="print-logo"
              src="/logo.svg"
              alt="Mahaveer Polyclinic"
            />
            <p>
              {data.invoice.invoice_no} · {dateOnly(data.invoice.created_at)}
            </p>
          </div>
          <div className="invoice-heading">
            <div>
              <span className="eyebrow">BILLED TO</span>
              <h3>{data.invoice.patient_name}</h3>
              <p>
                {data.invoice.patient_no} · {data.invoice.phone}
              </p>
              <p>
                {data.invoice.doctor_name || "Direct service"}
                {data.invoice.referrer_name
                  ? " · Referred by " + data.invoice.referrer_name
                  : ""}
              </p>
            </div>
            <Status value={data.invoice.payment_status} />
          </div>
          <Table
            rows={data.items}
            columns={[
              { title: "Description", key: "description" },
              { title: "Quantity", key: "quantity" },
              { title: "Rate", render: (r) => money(r.unit_price_paise) },
              { title: "Tax %", render: (r) => Number(r.tax_bps) / 100 },
              { title: "Total", render: (r) => money(r.line_total_paise) },
            ]}
          />
          <div className="invoice-totals">
            {[
              ["Subtotal", data.invoice.subtotal_paise],
              ["Discount", data.invoice.discount_paise],
              ["Tax", data.invoice.tax_paise],
              ["Invoice total", data.invoice.total_paise],
              ["Net paid", data.invoice.paid_paise],
              ["Balance due", data.invoice.balance_paise],
            ].map(([t, v]) => (
              <div key={t}>
                <span>{t}</span>
                <strong>{money(v)}</strong>
              </div>
            ))}
          </div>
          {data.batches.length > 0 && (
            <>
              <h3>Dispensed batches</h3>
              <Table
                rows={data.batches}
                rowKey="batch_no"
                columns={[
                  { title: "Medicine", key: "name" },
                  { title: "Batch", key: "batch_no" },
                  { title: "Expiry", render: (r) => dateOnly(r.expires_on) },
                  { title: "Quantity", render: (r) => Math.abs(r.quantity) },
                ]}
              />
            </>
          )}
          <h3>Payment history</h3>
          <Table
            rows={data.payments}
            columns={[
              {
                title: "Recorded",
                render: (r) =>
                  dateOnly(r.created_at) + " " + time(r.created_at),
              },
              { title: "Type", key: "kind" },
              { title: "Method", key: "method" },
              { title: "Amount", render: (r) => money(r.amount_paise) },
              { title: "Reference", key: "reference" },
              { title: "Recorded by", key: "recorded_by" },
            ]}
          />
          <div className="no-print">
            <div className="action-strip">
              <Button variant="secondary" onClick={() => window.print()}>
                Print invoice
              </Button>
              {["owner", "accountant"].includes(user.role) &&
                Number(data.invoice.paid_paise) > 0 && (
                  <Button
                    variant="text"
                    onClick={() => {
                      setMode(mode === "payment" ? "refund" : "payment");
                      setKey(crypto.randomUUID());
                    }}
                  >
                    {mode === "payment"
                      ? "Record a refund"
                      : "Record a payment"}
                  </Button>
                )}
            </div>
            {(Number(data.invoice.balance_paise) > 0 || mode === "refund") && (
              <form
                onSubmit={submit}
                className="payment-form"
                key={version + "-" + mode}
              >
                <h3>
                  {mode === "refund"
                    ? "Record refund"
                    : "Record received payment"}
                </h3>
                <p className="muted">
                  This records a payment already received or returned. It does
                  not charge a bank account or process a UPI transfer.
                </p>
                <div className="form-grid">
                  <Field
                    label="Amount (₹)"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={
                      Number(
                        mode === "refund"
                          ? data.invoice.paid_paise
                          : data.invoice.balance_paise,
                      ) / 100
                    }
                    defaultValue={
                      Number(
                        mode === "refund"
                          ? data.invoice.paid_paise
                          : data.invoice.balance_paise,
                      ) / 100
                    }
                    required
                  />
                  <Field label="Method">
                    <select name="method">
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank transfer</option>
                    </select>
                  </Field>
                  <Field label="Transaction reference" name="reference" />
                  {mode === "refund" && (
                    <Field
                      label="Refund reason"
                      name="reason"
                      required
                      minLength={3}
                    />
                  )}
                </div>
                <ErrorBox error={payError} />
                <Button busy={busy}>
                  {mode === "refund" ? "Record refund" : "Record payment"}
                </Button>
              </form>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
export function ReceiveStock({ catalog, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api("/inventory/receive", {
        method: "POST",
        body: {
          ...f,
          item_id: Number(f.item_id),
          supplier_id: Number(f.supplier_id) || null,
          quantity: Number(f.quantity),
          cost_price_paise: paise(f.cost),
        },
      });
      onSaved("Stock received");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Receive stock" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Inventory item">
          <select name="item_id" required>
            {catalog.items.map((i) => (
              <option value={i.id} key={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Supplier">
          <select name="supplier_id">
            <option value="">Choose supplier</option>
            {catalog.suppliers.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Batch number" name="batch_no" required />
          <Field label="Expiry date" name="expires_on" type="date" required />
          <Field
            label="Received quantity"
            name="quantity"
            type="number"
            min="1"
            required
          />
          <Field
            label="Cost per unit (₹)"
            name="cost"
            type="number"
            min="0"
            step=".01"
            required
          />
        </div>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Receive batch</Button>
        </div>
      </form>
    </Modal>
  );
}
export function AdjustStock({ batch, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await api("/inventory/adjust", {
        method: "POST",
        body: {
          batch_id: Number(batch.id),
          quantity: Number(f.get("quantity")),
          reason: f.get("reason"),
        },
      });
      onSaved("Stock adjustment recorded");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Adjust batch stock" onClose={onClose}>
      <p>
        {batch.name} · {batch.batch_no} · Current quantity {batch.quantity}
      </p>
      <form onSubmit={submit}>
        <Field
          label="Change in quantity (negative to remove)"
          name="quantity"
          type="number"
          required
        />
        <Field label="Reason" name="reason" required minLength={5} />
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Record adjustment</Button>
        </div>
      </form>
    </Modal>
  );
}
