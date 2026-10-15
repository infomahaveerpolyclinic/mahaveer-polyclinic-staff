import React, { useState, useEffect } from "react";
import { api, today, paise, dateOnly, label } from "../api";
import {
  Button,
  Field,
  Modal,
  ErrorBox,
  PatientPicker,
  Loading,
  useLoad,
  Details,
  Table,
  Status,
} from "./ui";
export function Encounter({ appointment, catalog, onClose, onSaved }) {
  const {
    data: initial,
    loading,
    error: loadError,
  } = useLoad("/encounters/" + appointment.id);
  return (
    <Modal
      title={"Consultation: " + appointment.patient_name}
      subtitle={appointment.appointment_no}
      wide
      onClose={onClose}
    >
      {loading ? (
        <Loading />
      ) : loadError ? (
        <ErrorBox error={loadError} />
      ) : (
        <EncounterInner
          appointment={appointment}
          initial={initial}
          catalog={catalog}
          onSaved={onSaved}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
function EncounterInner({ appointment, initial, catalog, onSaved, onClose }) {
  const [record, setRecord] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [rx, setRx] = useState(false),
    [lab, setLab] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      sign = e.nativeEvent.submitter?.value === "sign";
    setBusy(true);
    setError("");
    try {
      const r = await api("/encounters", {
        method: "POST",
        body: {
          appointment_id: Number(appointment.id),
          complaint: f.get("complaint"),
          diagnosis: f.get("diagnosis"),
          clinical_notes: f.get("clinical_notes"),
          allergies: f.get("allergies"),
          vitals: Object.fromEntries(
            ["bp", "pulse", "temperature", "weight", "spo2"].map((k) => [
              k,
              f.get(k),
            ]),
          ),
          follow_up_date: f.get("follow_up_date") || null,
          sign,
        },
      });
      setRecord(r);
      onSaved(sign ? "Notes signed" : "Draft saved");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function complete() {
    setBusy(true);
    try {
      await api("/appointments/" + appointment.id, {
        method: "PATCH",
        body: { status: "completed" },
      });
      onSaved("Visit completed");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="info-box">
        <strong>{appointment.doctor_name}</strong>
        <p>
          Record only findings and prescriptions reviewed by the treating
          clinician.
        </p>
      </div>
      <form onSubmit={submit}>
        <fieldset
          disabled={!!record?.signed_at || busy}
          className="form-fieldset"
        >
          <div className="vitals-grid">
            {[
              ["Blood pressure", "bp"],
              ["Pulse", "pulse"],
              ["Temperature", "temperature"],
              ["Weight", "weight"],
              ["SpO₂", "spo2"],
            ].map(([name, k]) => (
              <Field
                key={k}
                label={name}
                name={k}
                defaultValue={initial?.vitals?.[k] || ""}
              />
            ))}
          </div>
          <div className="form-grid">
            <Field label="Presenting complaint">
              <textarea
                name="complaint"
                defaultValue={initial?.complaint}
                rows={3}
              />
            </Field>
            <Field label="Diagnosis / assessment">
              <textarea
                name="diagnosis"
                defaultValue={initial?.diagnosis}
                rows={3}
              />
            </Field>
          </div>
          <Field label="Clinical notes">
            <textarea
              name="clinical_notes"
              defaultValue={initial?.clinical_notes}
              rows={4}
            />
          </Field>
          <div className="form-grid">
            <Field label="Allergies / relevant precautions">
              <textarea
                name="allergies"
                defaultValue={initial?.allergies}
                rows={2}
              />
            </Field>
            <Field
              label="Follow-up date"
              type="date"
              name="follow_up_date"
              min={today()}
              defaultValue={String(initial?.follow_up_date || "").slice(0, 10)}
            />
          </div>
        </fieldset>
        <ErrorBox error={error} />
        {!record?.signed_at && (
          <div className="form-actions">
            <Button type="submit" value="draft" variant="secondary" busy={busy}>
              Save draft
            </Button>
            <Button type="submit" value="sign" busy={busy}>
              Sign notes
            </Button>
          </div>
        )}
      </form>
      {record && (
        <div className="action-strip">
          <Button variant="secondary" onClick={() => setRx(true)}>
            Add prescription
          </Button>
          <Button variant="secondary" onClick={() => setLab(true)}>
            Order lab tests
          </Button>
          {record.signed_at && (
            <Button onClick={complete} busy={busy}>
              Complete visit
            </Button>
          )}
        </div>
      )}
      {record?.signed_at && (
        <p className="muted">
          Signed notes are locked. Prescriptions and lab orders are recorded
          separately.
        </p>
      )}
      {rx && (
        <PrescriptionForm
          encounter={record}
          catalog={catalog}
          onClose={() => setRx(false)}
          onSaved={onSaved}
        />
      )}{" "}
      {lab && (
        <LabOrderForm
          encounter={record}
          catalog={catalog}
          onClose={() => setLab(false)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
export function PrescriptionForm({ encounter, catalog, onClose, onSaved }) {
  const [lines, setLines] = useState([
      {
        item_id: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: 1,
        instructions: "",
      },
    ]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (index, key, value) =>
    setLines(lines.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/prescriptions", {
        method: "POST",
        body: {
          encounter_id: Number(encounter.id),
          notes: new FormData(e.currentTarget).get("notes"),
          items: lines.map((l) => ({
            ...l,
            item_id: Number(l.item_id),
            quantity: Number(l.quantity),
          })),
        },
      });
      onSaved("Prescription recorded");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Write prescription" onClose={onClose} wide>
      <form onSubmit={submit}>
        {lines.map((l, i) => (
          <div className="line-item-form" key={i}>
            <div className="row-between">
              <strong>Medicine {i + 1}</strong>
              {lines.length > 1 && (
                <Button
                  type="button"
                  variant="text danger"
                  onClick={() => setLines(lines.filter((_, j) => i !== j))}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="form-grid">
              <Field label="Medicine">
                <select
                  value={l.item_id}
                  onChange={(e) => set(i, "item_id", e.target.value)}
                  required
                >
                  <option value="">Choose a medicine</option>
                  {catalog.items
                    .filter((m) => m.kind === "medicine" && m.active)
                    .map((m) => (
                      <option value={m.id} key={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field
                label="Dosage"
                value={l.dosage}
                onChange={(e) => set(i, "dosage", e.target.value)}
                required
              />
              <Field
                label="Frequency"
                value={l.frequency}
                onChange={(e) => set(i, "frequency", e.target.value)}
                required
              />
              <Field
                label="Duration"
                value={l.duration}
                onChange={(e) => set(i, "duration", e.target.value)}
                required
              />
              <Field
                label="Quantity"
                type="number"
                min="1"
                max="1000"
                value={l.quantity}
                onChange={(e) => set(i, "quantity", e.target.value)}
                required
              />
              <Field
                label="Instructions"
                value={l.instructions}
                onChange={(e) => set(i, "instructions", e.target.value)}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setLines([
              ...lines,
              {
                item_id: "",
                dosage: "",
                frequency: "",
                duration: "",
                quantity: 1,
                instructions: "",
              },
            ])
          }
        >
          Add medicine
        </Button>
        <Field label="Prescription notes">
          <textarea name="notes" rows={2} />
        </Field>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Issue prescription</Button>
        </div>
      </form>
    </Modal>
  );
}
export function LabOrderForm({ encounter, catalog, onClose, onSaved }) {
  const [ops, setOps] = useState({ partners: [], collection_slots: [] });
  const [mode, setMode] = useState("clinic");
  useEffect(() => {
    api("/ops/catalog")
      .then(setOps)
      .catch(() => {});
  }, []);
  const [patient, setPatient] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!patient && !encounter) {
      setError("Choose a patient.");
      return;
    }
    setBusy(true);
    try {
      await api("/lab-orders", {
        method: "POST",
        body: {
          patient_id: Number(encounter?.patient_id || patient.id),
          doctor_id: encounter?.doctor_id || Number(f.get("doctor_id")) || null,
          encounter_id: encounter?.id || null,
          referrer_id: Number(f.get("referrer_id")) || null,
          external_doctor: f.get("external_doctor") || "",
          partner_id: Number(f.get("partner_id")) || null,
          direction: f.get("direction") || "internal",
          collection_mode: mode,
          collection_address: f.get("collection_address") || "",
          collection_slot_id: Number(f.get("collection_slot_id")) || null,
          transport_note: f.get("transport_note") || "",
          partner_reference: f.get("partner_reference") || "",
          test_ids: f.getAll("test_ids").map(Number),
        },
      });
      onSaved("Lab order and invoice created");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Order laboratory tests" onClose={onClose}>
      <form onSubmit={submit}>
        {!encounter && (
          <>
            <PatientPicker value={patient} onChange={setPatient} />
            <div className="form-grid">
              <Field label="Referring clinic doctor">
                <select name="doctor_id">
                  <option value="">No internal referral</option>
                  {catalog.doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="External doctor" name="external_doctor" />
            </div>
            <Field label="Referral source">
              <select name="referrer_id">
                <option value="">Self / direct</option>
                {catalog.referrers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        <div className="form-grid">
          <Field label="Laboratory exchange">
            <select name="direction">
              <option value="internal">Internal clinic</option>
              <option value="inbound">Partner sample — test here</option>
              <option value="outbound">Send sample to partner</option>
            </select>
          </Field>
          <Field label="Partner laboratory">
            <select name="partner_id">
              <option value="">None</option>
              {(ops.partners || [])
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Partner reference" name="partner_reference" />
          <Field label="Collection mode">
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="clinic">Clinic</option>
              <option value="home">Home</option>
              <option value="partner">Partner laboratory</option>
            </select>
          </Field>
        </div>
        {mode === "home" && (
          <>
            <Field label="Collection window">
              <select name="collection_slot_id" required>
                <option value="">Choose…</option>
                {(ops.collection_slots || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {dateOnly(s.starts_at)} ·{" "}
                    {new Date(s.starts_at).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Collection address"
              name="collection_address"
              required
            />
          </>
        )}
        <Field label="Transport / sample handover notes">
          <textarea name="transport_note" />
        </Field>
        <fieldset className="test-checks">
          <legend>Select tests</legend>
          {catalog.tests
            .filter((t) => t.active)
            .map((t) => (
              <label className="checkbox" key={t.id}>
                <input type="checkbox" name="test_ids" value={t.id} />
                <span>
                  <strong>{t.name}</strong>
                  <small>
                    {t.sample_type} · {t.turnaround_hours} hours
                  </small>
                </span>
              </label>
            ))}
        </fieldset>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Create order & bill</Button>
        </div>
      </form>
    </Modal>
  );
}
export function LabDetail({ order, user, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const canEdit = ["lab", "lab_manager"].includes(user.role);
  async function change(status, results) {
    setBusy(true);
    try {
      await api("/lab-orders/" + order.id, {
        method: "PATCH",
        body: { status, results },
      });
      onSaved("Lab order updated");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    change(
      "awaiting_review",
      order.items.map((i) => ({
        id: Number(i.id),
        result: f.get("result" + i.id),
        units: f.get("units" + i.id),
        reference_range: f.get("ref" + i.id),
        flag: f.get("flag" + i.id),
      })),
    );
  }
  return (
    <Modal title={"Sample " + order.sample_code} onClose={onClose} wide>
      <div className="print-brand">
        <img className="print-logo" src="/logo.svg" alt="Mahaveer Polyclinic" />
        <p>Laboratory report</p>
      </div>
      <div className="row-between">
        <h3>{order.patient_name}</h3>
        <Status value={order.status} />
      </div>
      <Details
        items={[
          ["Patient ID", order.patient_no],
          [
            "Referring doctor",
            order.doctor_name || order.external_doctor || "Self / direct",
          ],
          ["Order date", dateOnly(order.created_at)],
          ["Released", dateOnly(order.released_at)],
        ]}
      />
      {order.status !== "released" && (
        <div className="info-box">
          Not a final report. Results require independent laboratory review.
        </div>
      )}
      {canEdit && order.status === "processing" ? (
        <form onSubmit={submit}>
          {order.items.map((i) => (
            <div className="line-item-form" key={i.id}>
              <h3>{i.name}</h3>
              <div className="form-grid">
                <Field label="Result" name={"result" + i.id} required />
                <Field label="Units" name={"units" + i.id} />
                <Field label="Laboratory reference range" name={"ref" + i.id} />
                <Field label="Result flag">
                  <select name={"flag" + i.id}>
                    <option value="not_applicable">Not applicable</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
          <Button busy={busy}>Submit for review</Button>
        </form>
      ) : (
        <Table
          rows={order.items}
          columns={[
            { title: "Test", key: "name" },
            { title: "Result", render: (r) => r.result || "Pending" },
            { title: "Units", key: "units" },
            { title: "Reference range", key: "reference_range" },
            {
              title: "Flag",
              render: (r) => <Status value={r.flag || "pending"} />,
            },
          ]}
        />
      )}
      <ErrorBox error={error} />
      <div className="form-actions no-print">
        {canEdit && order.status === "ordered" && (
          <Button busy={busy} onClick={() => change("collected")}>
            Confirm sample collected
          </Button>
        )}
        {canEdit && order.status === "collected" && (
          <Button busy={busy} onClick={() => change("processing")}>
            Begin processing
          </Button>
        )}
        {user.role === "lab_manager" && order.status === "awaiting_review" && (
          <Button busy={busy} onClick={() => change("released")}>
            Verify & release report
          </Button>
        )}
        {order.status === "released" && (
          <Button variant="secondary" onClick={() => window.print()}>
            Print report
          </Button>
        )}
      </div>
    </Modal>
  );
}
export function RehabForm({ catalog, plan, onClose, onSaved }) {
  const [patient, setPatient] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      if (plan)
        await api("/rehab/" + plan.id + "/sessions", {
          method: "POST",
          body: { ...v, pain_score: Number(v.pain_score) },
        });
      else {
        if (!patient) throw new Error("Choose a patient.");
        await api("/rehab", {
          method: "POST",
          body: {
            ...v,
            patient_id: Number(patient.id),
            planned_sessions: Number(v.planned_sessions),
            session_fee_paise: paise(v.fee),
          },
        });
      }
      onSaved(
        plan ? "Session and invoice recorded" : "Rehabilitation plan created",
      );
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={plan ? "Record completed session" : "Create rehabilitation plan"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {plan ? (
          <>
            <p>
              {plan.patient_name} · {plan.title}
            </p>
            <div className="form-grid">
              <Field
                label="Session date"
                type="date"
                name="session_date"
                max={today()}
                defaultValue={today()}
                required
              />
              <Field
                label="Patient reported pain (0 to 10)"
                name="pain_score"
                type="number"
                min="0"
                max="10"
                required
              />
            </div>
            <Field label="Session notes">
              <textarea name="notes" required rows={4} />
            </Field>
          </>
        ) : (
          <>
            <PatientPicker value={patient} onChange={setPatient} />
            <Field label="Plan title" name="title" required />
            <Field label="Goals">
              <textarea name="goals" rows={3} required />
            </Field>
            <div className="form-grid">
              <Field
                label="Planned sessions"
                name="planned_sessions"
                type="number"
                min="1"
                max="100"
                required
              />
              <Field
                label="Fee per session (₹)"
                name="fee"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
          </>
        )}
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>
            {plan ? "Save session & create bill" : "Create plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
