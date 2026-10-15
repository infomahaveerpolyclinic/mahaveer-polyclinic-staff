import { PasswordInput } from "../Experience";
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Search,
  LoaderCircle,
  Plus,
  ArrowUpRight,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { api, label } from "../api";
export function Brand({ subtitle = "CARE TEAM" }) {
  return (
    <div className="brand vector-brand">
      <img src="/logo.svg" alt="Mahaveer Polyclinic" />
      <small>{subtitle}</small>
    </div>
  );
}
export function Button({
  busy,
  children,
  variant = "",
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={"btn " + variant + " " + className}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Field({ label: caption, children, ...props }) {
  return (
    <label className="field">
      <span>{caption}</span>
      {children ||
        (props.type === "password" ? (
          <PasswordInput {...props} />
        ) : (
          <input {...props} />
        ))}
    </label>
  );
}
export function Status({ value }) {
  return <span className={"status status-" + value}>{label(value)}</span>;
}
export function Empty({
  title = "Nothing here yet",
  text = "Records will appear here when they are created.",
  action,
}) {
  return (
    <div className="empty">
      <Inbox size={31} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <span>Loading clinic records...</span>
    </div>
  );
}
export function ErrorBox({ error }) {
  return error ? (
    <div className="error" role="alert">
      <AlertCircle size={17} />
      {error}
    </div>
  ) : null;
}
export function Modal({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
    return () => {};
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="modal-head no-print">
        <div>
          <span className="eyebrow">{subtitle || "MAHAVEER POLY CLINIC"}</span>
          <h2>{title}</h2>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={22} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function SearchBox({ value, onChange, placeholder = "Search records" }) {
  return (
    <div className="search-box">
      <Search size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
export function PageHead({ eyebrow, title, description, action }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow || "CLINIC OPERATIONS"}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Table({
  columns,
  rows,
  rowKey = "id",
  empty = "No matching records",
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[rowKey] ?? i}>
              {columns.map((c, j) => (
                <td key={j}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty title={empty} />}
    </div>
  );
}
export function useLoad(path, version = 0) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api(path)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, version]);
  return { data, error, loading, setData };
}
export function PatientPicker({ value, onChange, initialName = "" }) {
  const [q, setQ] = useState(initialName),
    [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const timer = setTimeout(() => {
      api("/patients?q=" + encodeURIComponent(q))
        .then((d) => alive && setRows(d.rows))
        .catch((e) => alive && setError(e.message));
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, open]);
  return (
    <div className="patient-picker">
      <Field label="Find patient by name, phone or patient ID">
        <input
          value={q}
          placeholder="Search existing patient"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            onChange(null);
            setOpen(true);
          }}
        />
      </Field>
      {value && (
        <span className="selection-note">
          Selected: {value.patient_no} · {value.name}
        </span>
      )}
      {open && (
        <div className="picker-results">
          {rows.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                onChange(p);
                setQ(p.name);
                setOpen(false);
              }}
            >
              <strong>{p.name}</strong>
              <small>
                {p.patient_no} · {p.phone} · DOB{" "}
                {String(p.date_of_birth).slice(0, 10)}
              </small>
            </button>
          ))}
          {!rows.length && (
            <p>
              {error ||
                "No matching patients. Reception can register a new patient."}
            </p>
          )}
          <button type="button" onClick={() => setOpen(false)}>
            Close search
          </button>
        </div>
      )}
    </div>
  );
}
export function Stat({ title, value, detail, icon: Icon, tone = "" }) {
  return (
    <div className={"stat " + tone}>
      <div>
        <span>{title}</span>
        {Icon && <Icon size={19} />}
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function Details({ items }) {
  return (
    <dl className="details-grid">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v || "Not recorded"}</dd>
        </div>
      ))}
    </dl>
  );
}
