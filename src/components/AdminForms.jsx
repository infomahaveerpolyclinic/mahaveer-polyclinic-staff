import { PasswordInput } from "../Experience";
import React, { useState } from "react";
import { api, label, paise } from "../api";
import { Modal, Button, Field, ErrorBox } from "./ui";
export const fields = {
  doctors: [
    ["name", "Full name"],
    ["user_id", "Linked staff account", "users"],
    ["department_id", "Department", "departments"],
    ["qualification", "Qualifications"],
    ["registration_no", "Professional registration number"],
    ["specialization", "Specialization"],
    ["experience_years", "Years of experience", "number"],
    ["consultation_fee_paise", "Consultation fee (₹)", "money"],
    ["bio", "Profile introduction", "textarea"],
    ["referred_by", "Introduced / referred by"],
    ["active", "Active", "checkbox"],
    ["image_url", "Doctor image URL (HTTPS, optional)"],
    ["can_edit_fee", "Allow clinician to update their fee", "checkbox"],
  ],
  departments: [
    ["name", "Department name"],
    ["description", "Description", "textarea"],
    ["active", "Active", "checkbox"],
  ],
  tests: [
    ["code", "Test code"],
    ["name", "Test name"],
    ["category", "Category"],
    ["sample_type", "Sample type"],
    ["turnaround_hours", "Turnaround hours", "number"],
    ["preparation", "Patient preparation", "textarea"],
    ["price_paise", "Price (₹)", "money"],
    ["reference_note", "Reference note", "textarea"],
    ["image_url", "Test image URL (HTTPS, optional)"],
    ["home_collection", "Home sample collection", "checkbox"],
    ["active", "Active", "checkbox"],
  ],
  items: [
    ["sku", "SKU / item code"],
    ["name", "Item name"],
    ["generic_name", "Generic name"],
    ["description", "Description", "textarea"],
    ["image_url", "Medicine image URL (HTTPS, optional)"],
    ["home_delivery", "Allow home delivery", "checkbox"],
    ["kind", "Item type", ["medicine", "consumable"]],
    ["unit", "Stock unit"],
    ["prescription_required", "Requires prescription", "checkbox"],
    ["selling_price_paise", "Selling price per unit (₹)", "money"],
    ["tax_bps", "Tax percentage", "tax"],
    ["reorder_level", "Low stock threshold", "number"],
    ["active", "Active", "checkbox"],
  ],
  suppliers: [
    ["name", "Supplier name"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["gstin", "GST number"],
    ["address", "Address", "textarea"],
  ],
  referrers: [
    ["name", "Referrer name"],
    ["kind", "Referral type", ["doctor", "patient", "campaign", "other"]],
    ["phone", "Phone"],
    ["organization", "Organization"],
    ["active", "Active", "checkbox"],
  ],
  programs: [
    ["name", "Program name"],
    ["description", "Description", "textarea"],
    ["category", "Care category"],
    ["active", "Active", "checkbox"],
  ],
};
const defaults = {
  active: true,
  is_demo: false,
  prescription_required: false,
  experience_years: 0,
  consultation_fee_paise: 0,
  price_paise: 0,
  selling_price_paise: 0,
  tax_bps: 0,
  reorder_level: 10,
  turnaround_hours: 24,
  unit: "unit",
  kind: "medicine",
};
export function CatalogForm({
  type,
  record,
  catalog,
  users = [],
  onClose,
  onSaved,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      v = {};
    for (const [key, , kind] of fields[type]) {
      const raw = f.get(key);
      v[key] =
        kind === "checkbox"
          ? raw === "on"
          : ["number", "tax", "money"].includes(kind)
            ? kind === "money" || kind === "tax"
              ? paise(raw)
              : Number(raw)
            : ["users", "departments"].includes(kind)
              ? Number(raw) || null
              : raw || "";
    }
    setBusy(true);
    try {
      await api("/admin/catalog/" + type + (record ? "/" + record.id : ""), {
        method: record ? "PUT" : "POST",
        body: v,
      });
      onSaved("Catalog updated");
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
        (record ? "Edit " : "Add ") +
        label(type === "items" ? "inventory item" : type.replace(/s$/, ""))
      }
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {fields[type].map(([key, caption, kind]) => {
            const value = record?.[key] ?? defaults[key] ?? "";
            if (kind === "checkbox")
              return (
                <label key={key} className="checkbox">
                  <input type="checkbox" name={key} defaultChecked={!!value} />
                  {caption}
                </label>
              );
            if (kind === "users" || kind === "departments") {
              const list =
                kind === "users"
                  ? users.filter((u) => ["doctor", "physio"].includes(u.role))
                  : catalog.departments;
              return (
                <Field key={key} label={caption}>
                  <select name={key} defaultValue={value}>
                    <option value="">Not linked</option>
                    {list.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            }
            if (Array.isArray(kind))
              return (
                <Field key={key} label={caption}>
                  <select name={key} defaultValue={value || kind[0]}>
                    {kind.map((o) => (
                      <option key={o} value={o}>
                        {label(o)}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            return (
              <Field label={caption} key={key}>
                {kind === "textarea" ? (
                  <textarea name={key} rows={3} defaultValue={value} />
                ) : (
                  <input
                    name={key}
                    defaultValue={
                      ["money", "tax"].includes(kind)
                        ? Number(value || 0) / 100
                        : value
                    }
                    type={
                      ["number", "money", "tax"].includes(kind)
                        ? "number"
                        : "text"
                    }
                    min={0}
                    step={["money", "tax"].includes(kind) ? ".01" : "1"}
                    required={
                      ![
                        "registration_no",
                        "referred_by",
                        "phone",
                        "email",
                        "gstin",
                        "generic_name",
                        "image_url",
                      ].includes(key)
                    }
                  />
                )}
              </Field>
            );
          })}
        </div>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
export function UserForm({ record, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      v = { role: f.get("role") };
    if (record) {
      v.active = f.get("active") === "on";
      if (f.get("password")) v.password = f.get("password");
    } else
      Object.assign(v, {
        name: f.get("name"),
        email: f.get("email"),
        password: f.get("password"),
      });
    setBusy(true);
    try {
      await api("/admin/users" + (record ? "/" + record.id : ""), {
        method: record ? "PATCH" : "POST",
        body: v,
      });
      onSaved("Staff access updated");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={record ? "Manage staff access" : "Add staff account"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {!record && (
          <div className="form-grid">
            <Field label="Full name" name="name" required />
            <Field label="Email" name="email" type="email" required />
          </div>
        )}
        <Field label="Role">
          <select name="role" defaultValue={record?.role || "receptionist"}>
            {[
              "owner",
              "receptionist",
              "doctor",
              "physio",
              "lab",
              "lab_manager",
              "pharmacy",
              "inventory",
              "accountant",
            ].map((r) => (
              <option value={r} key={r}>
                {label(r)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={
            record
              ? "Reset password (leave blank to keep)"
              : "Temporary password (minimum 12 characters)"
          }
          name="password"
          type="password"
          required={!record}
          minLength={12}
          autoComplete="new-password"
        />
        {record && (
          <label className="checkbox">
            <input
              name="active"
              type="checkbox"
              defaultChecked={record.active}
            />{" "}
            Account is active
          </label>
        )}
        <p className="muted">
          New accounts and password resets require a password change at the next
          sign-in. Link clinicians to a doctor profile to assign consultations.
        </p>
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Save account</Button>
        </div>
      </form>
    </Modal>
  );
}
export function PasswordForm({ required, onClose, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    if (v.new_password !== v.confirm) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api("/auth/password", { method: "POST", body: v });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={required ? "Set your own password" : "Change password"}
      onClose={() => !required && onClose()}
    >
      <form onSubmit={submit}>
        <Field
          label="Current password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
        />
        <Field
          label="New password (12 or more characters)"
          name="new_password"
          type="password"
          minLength={12}
          required
          autoComplete="new-password"
        />
        <Field
          label="Confirm new password"
          name="confirm"
          type="password"
          minLength={12}
          required
          autoComplete="new-password"
        />
        <ErrorBox error={error} />
        <div className="form-actions">
          <Button busy={busy}>Update password</Button>
        </div>
      </form>
    </Modal>
  );
}
