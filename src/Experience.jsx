import React, { useState, useEffect } from "react";
import { Moon, Sun, ArrowUp, Bell, Eye, EyeOff } from "lucide-react";
export function Experience() {
  const [theme, setTheme] = useState(
      localStorage.getItem("mpc_theme") || "light",
    ),
    [cookie, setCookie] = useState(localStorage.getItem("mpc_staff_cookies")),
    [progress, setProgress] = useState(0);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mpc_theme", theme);
  }, [theme]);
  useEffect(() => {
    const f = () =>
      setProgress(
        (scrollY /
          Math.max(1, document.documentElement.scrollHeight - innerHeight)) *
          100,
      );
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  return (
    <>
      <div
        className="scroll-progress no-print"
        style={{ width: progress + "%" }}
      />
      <div className="experience-controls no-print">
        <button
          className="icon-btn"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <button
          className="icon-btn"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={19} />
        </button>
      </div>
      {!cookie && (
        <div className="staff-cookie no-print">
          <span>
            Essential cookies keep your session secure. Theme preferences are
            saved on this device.
          </span>
          <button
            onClick={() => {
              localStorage.setItem("mpc_staff_cookies", "essential");
              setCookie("essential");
            }}
          >
            Got it
          </button>
        </div>
      )}
    </>
  );
}
export function PasswordInput(props) {
  const [show, set] = useState(false);
  return (
    <span className="password-wrap">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => set(!show)}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </span>
  );
}
