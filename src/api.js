export const API = import.meta.env.VITE_API_URL || "/api";
let csrf = "";
export const setCSRF = (t) => {
  csrf = t || "";
};
export async function api(path, { body, ...options } = {}) {
  const res = await fetch(API + path, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await res
    .json()
    .catch(() => ({ error: "Cannot reach the clinic server." }));
  if (!res.ok) {
    const e = new Error(d.error || "Request failed.");
    e.status = res.status;
    throw e;
  }
  return d;
}
export async function download(path, name) {
  const r = await fetch(API + path, { credentials: "include" });
  if (!r.ok) throw new Error("Export could not be downloaded.");
  const blob = await r.blob(),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(n || 0) / 100);
export const dateOnly = (v) =>
  v
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(v))
    : "";
export const time = (v) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(v));
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
export const paise = (v) => Math.round(Number(v || 0) * 100);
export const label = (v) =>
  String(v || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
