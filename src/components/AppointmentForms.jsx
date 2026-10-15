import React, { useEffect, useState } from "react";
import { api, today, time, paise } from "../api";
import { Button, Field, Modal, ErrorBox, PatientPicker } from "./ui";
export function NewAppointment({ catalog, onClose, onSaved }) {
  const [patient, setPatient] = useState(null),
    [doctor, setDoctor] = useState(
      String(catalog.doctors.find((d) => d.active)?.id || ""),
    ),
    [day, setDay] = useState(today()),
    [slots, setSlots] = useState([]),
    [slot, setSlot] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setSlot("");
    if (doctor)
      api(`/public/slots?doctor_id=${doctor}&date=${day}`)
        .then((d) => alive && setSlots(d))
        .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [doctor, day]);
  async function submit(e) {
    e.preventDefault();
    if (!patient || !slot) {
      setError("Choose a registered patient and an available time.");
      return;
    }
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const appointment = await api("/appointments", {
        method: "POST",
        body: {
          patient_id: Number(patient.id),
          slot_id: Number(slot),
          name: patient.name,
          phone: patient.phone,
          date_of_birth: String(patient.date_of_birth).slice(0, 10),
          gender: patient.gender,
          reason: f.get("reason"),
          referral_note: f.get("referral_note") || "",
          consent: true,
          referrer_id: f.get("referrer_id")
            ? Number(f.get("referrer_id"))
            : null,
        },
      });
      onSaved(appointment);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="New appointment" onClose={onClose}>
      <form onSubmit={submit}>
        <PatientPicker value={patient} onChange={setPatient} />
        <div className="form-grid">
          <Field label="Clinician">
            <select value={doctor} onChange={(e) => setDoctor(e.target.value)}>
              {catalog.doctors
                .filter((d) => d.active)
                .map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field
            label="Date"
            type="date"
            value={day}
            min={today()}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        <Field label="Time (IST)">
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            required
          >
            <option value="">Choose an available time</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {time(s.starts_at)}
              </option>
            ))}
          </select>
        </Field>
        {slots.length === 0 && (
          <p className="muted">
            No open times. Try another date or add availability in the Doctors
            page.
          </p>
        )}
        <Field label="Referrer">
          <select name="referrer_id">
            <option value="">Self / direct visit</option>
            {catalog.referrers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason for visit">
          <textarea name="reason" rows={3} />
        </Field>
        <ErrorBox error={error} />
        <Field label="Referral note (optional)" name="referral_note" />
        <p className="muted">
          Payment must be confirmed before a token is issued. The invoice opens
          after booking.
        </p>
        <div className="form-actions">
          <Button busy={busy}>Book appointment</Button>
        </div>
      </form>
    </Modal>
  );
}
export function AvailabilityForm({ doctor, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const r = await api("/slots", {
        method: "POST",
        body: {
          ...f,
          doctor_id: Number(doctor.id),
          minutes: Number(f.minutes),
        },
      });
      onSaved(`${r.length} slots added`);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Add availability" subtitle={doctor.name} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Date" name="date" type="date" min={today()} required />
        <div className="form-grid">
          <Field
            label="Start time (IST)"
            name="start"
            type="time"
            defaultValue="09:00"
            required
          />
          <Field
            label="End time (IST)"
            name="end"
            type="time"
            defaultValue="13:00"
            required
          />
        </div>
        <Field label="Minutes per appointment">
          <select name="minutes">
            <option value="15">15 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </Field>
        <p className="muted">
          Existing or overlapping slots are preserved. New bookings can only use
          future times.
        </p>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Create slots</Button>
        </div>
      </form>
    </Modal>
  );
}
