import React, { useState } from "react";
import { api, today, dateOnly, money, label } from "../api";
import {
  Field,
  Button,
  ErrorBox,
  Modal,
  PatientPicker,
  Table,
  Status,
  Details,
  Loading,
  useLoad,
} from "./ui";
export function PatientForm({ patient, catalog, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      v = Object.fromEntries(f);
    v.consent = true;
    v.whatsapp_consent = f.get("whatsapp_consent") === "on";
    v.referrer_id = v.referrer_id ? Number(v.referrer_id) : null;
    setBusy(true);
    setError("");
    try {
      const p = await api("/patients" + (patient ? "/" + patient.id : ""), {
        method: patient ? "PATCH" : "POST",
        body: v,
      });
      onSaved(p);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={patient ? "Update patient details" : "Register a patient"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <p className="muted">
          Search existing records first. A shared family phone number can belong
          to more than one patient.
        </p>
        <div className="form-grid">
          <Field
            label="Full name"
            name="name"
            defaultValue={patient?.name}
            required
          />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            defaultValue={patient?.phone}
            required
          />
          <Field
            label="Date of birth"
            name="date_of_birth"
            type="date"
            min="1900-01-01"
            max={today()}
            defaultValue={String(patient?.date_of_birth || "").slice(0, 10)}
            required
          />
          <Field label="Gender">
            <select
              name="gender"
              defaultValue={patient?.gender || "unspecified"}
            >
              <option value="unspecified">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field
            label="Email (optional)"
            name="email"
            type="email"
            defaultValue={patient?.email}
          />
          <Field
            label="Emergency contact"
            name="emergency_contact"
            defaultValue={patient?.emergency_contact}
          />
          <Field label="Care category">
            <select
              name="category"
              defaultValue={patient?.category || "General"}
            >
              {[
                "General",
                "Senior care",
                "Women’s health",
                "Preventive care",
                "Rehabilitation",
                "Chronic care",
                "Pediatric care",
                "Corporate care",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Referred by">
            <select
              name="referrer_id"
              defaultValue={patient?.referrer_id || ""}
            >
              <option value="">Self / direct visit</option>
              {catalog.referrers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Address">
          <textarea name="address" defaultValue={patient?.address} rows={2} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" required /> Patient identity and consent to
          registration have been checked.
        </label>
        <ErrorBox error={error} />
        <label className="checkbox">
          <input
            type="checkbox"
            name="whatsapp_consent"
            defaultChecked={patient?.whatsapp_consent || false}
          />
          Patient agrees to appointment, bill, report and order updates on
          WhatsApp.
        </label>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button busy={busy}>Save patient</Button>
        </div>
      </form>
    </Modal>
  );
}
export function PatientRecord({ id, user, onClose, onInvoice, onEdit }) {
  const { data, error, loading } = useLoad("/patients/" + id);
  const [tab, setTab] = useState("Visits");
  if (loading)
    return (
      <Modal title="Patient record" onClose={onClose}>
        <Loading />
      </Modal>
    );
  if (error)
    return (
      <Modal title="Patient record" onClose={onClose}>
        <ErrorBox error={error} />
      </Modal>
    );
  const p = data.patient;
  const tabs = [
    data.appointments && "Visits",
    data.encounters && "Clinical notes",
    data.prescriptions && "Prescriptions",
    data.lab_orders && "Lab orders",
    data.invoices && "Bills",
  ].filter(Boolean);
  const currentTab = tabs.includes(tab) ? tab : tabs[0];
  return (
    <Modal
      title={p.name}
      subtitle={p.patient_no + " · PATIENT RECORD"}
      onClose={onClose}
      wide
    >
      <Details
        items={[
          ["Phone", p.phone],
          ["Date of birth", dateOnly(p.date_of_birth)],
          ["Gender", label(p.gender)],
          ["Care category", p.category],
          ["Referred by", p.referrer_name || "Self / direct"],
          ["Registered", dateOnly(p.created_at)],
        ]}
      />
      {["owner", "receptionist"].includes(user.role) && (
        <Button variant="secondary" onClick={() => onEdit(p)}>
          Edit details
        </Button>
      )}
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={currentTab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {currentTab === "Visits" && (
        <Table
          rows={data.appointments || []}
          columns={[
            { title: "Visit", key: "appointment_no" },
            { title: "Date", render: (r) => dateOnly(r.starts_at) },
            { title: "Clinician", key: "doctor_name" },
            { title: "Status", render: (r) => <Status value={r.status} /> },
          ]}
        />
      )}
      {currentTab === "Clinical notes" &&
        (data.encounters || []).map((e) => (
          <article className="note-card" key={e.id}>
            <div className="row-between">
              <h3>{e.doctor_name}</h3>
              <Status value={e.signed_at ? "signed" : "draft"} />
            </div>
            <small>{dateOnly(e.created_at)}</small>
            <Details
              items={[
                ["Complaint", e.complaint],
                ["Diagnosis", e.diagnosis],
                ["Allergies", e.allergies],
                ["Follow-up", dateOnly(e.follow_up_date)],
              ]}
            />
            <p className="preserve-space">{e.clinical_notes}</p>
          </article>
        ))}
      {currentTab === "Prescriptions" &&
        (data.prescriptions || []).map((p) => (
          <article className="note-card" key={p.id}>
            <h3>
              Prescription #{p.id} · {p.doctor_name}
            </h3>
            <small>{dateOnly(p.created_at)}</small>
            <Table
              rows={p.items}
              columns={[
                { title: "Medicine", key: "name" },
                { title: "Dosage", key: "dosage" },
                { title: "Frequency", key: "frequency" },
                { title: "Duration", key: "duration" },
                {
                  title: "Dispensed",
                  render: (r) => `${r.dispensed_quantity} / ${r.quantity}`,
                },
              ]}
            />
            <p>{p.notes}</p>
          </article>
        ))}
      {currentTab === "Lab orders" && (
        <Table
          rows={data.lab_orders || []}
          columns={[
            { title: "Sample", key: "sample_code" },
            { title: "Date", render: (r) => dateOnly(r.created_at) },
            { title: "Doctor", key: "doctor_name" },
            { title: "Status", render: (r) => <Status value={r.status} /> },
          ]}
        />
      )}
      {currentTab === "Bills" && (
        <Table
          rows={data.invoices || []}
          columns={[
            { title: "Invoice", key: "invoice_no" },
            { title: "Type", render: (r) => label(r.kind) },
            { title: "Total", render: (r) => money(r.total_paise) },
            { title: "Outstanding", render: (r) => money(r.balance_paise) },
            {
              title: "Status",
              render: (r) => <Status value={r.payment_status} />,
            },
            {
              title: "",
              render: (r) => (
                <Button variant="text" onClick={() => onInvoice(r.id)}>
                  View bill
                </Button>
              ),
            },
          ]}
        />
      )}
    </Modal>
  );
}
export function ResolveAppointment({ appointment, catalog, onClose, onSaved }) {
  const [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [create, setCreate] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!selected) {
      setError("Select or register the patient first.");
      return;
    }
    setBusy(true);
    try {
      await api("/appointments/" + appointment.id, {
        method: "PATCH",
        body: { status: "confirmed", patient_id: Number(selected.id) },
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Verify and confirm the visit" onClose={onClose}>
      <div className="info-box">
        <strong>Website request: {appointment.appointment_no}</strong>
        <p>
          {appointment.requested_name} · {appointment.requested_phone}
        </p>
        <p>Date of birth: {dateOnly(appointment.requested_dob)}</p>
      </div>
      <form onSubmit={submit}>
        <PatientPicker
          value={selected}
          onChange={setSelected}
          initialName={appointment.requested_phone}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => setCreate(true)}
        >
          Register a new patient
        </Button>
        <label className="checkbox">
          <input type="checkbox" required /> I have verified the name, date of
          birth and phone number with the patient.
        </label>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Confirm appointment</Button>
        </div>
      </form>
      {create && (
        <PatientForm
          catalog={catalog}
          onClose={() => setCreate(false)}
          onSaved={setSelected}
        />
      )}
    </Modal>
  );
}
