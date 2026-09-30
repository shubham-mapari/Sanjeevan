"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  RotateCw,
  School,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeEmployeeIdentifier } from "@/lib/auth-helpers";
import type { AdminRole } from "@/lib/auth-types";

const ROLE_PRESETS = [
  {
    role: "Super Admin" as AdminRole,
    employeeId: "SAN-ADM-001",
    label: "Super Admin",
    desc: "Full System Access",
  },
  {
    role: "Principal" as AdminRole,
    employeeId: "SAN-PRN-002",
    label: "Principal",
    desc: "Executive Oversight",
  },
  {
    role: "HOD" as AdminRole,
    employeeId: "SAN-HOD-003",
    label: "HOD (Computer Eng.)",
    desc: "Department Operations",
  },
  {
    role: "Teacher" as AdminRole,
    employeeId: "SAN-TCH-004",
    label: "Teacher / Faculty",
    desc: "Academics & Evaluations",
  },
  {
    role: "Office Staff" as AdminRole,
    employeeId: "SAN-OFF-005",
    label: "Office Staff",
    desc: "Admissions & Records",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("Super Admin");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    return searchParams.get("error") === "missing_config"
      ? "Supabase connection credentials are missing. Check environment configuration."
      : null;
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [showRoleHelper, setShowRoleHelper] = useState(false);

  // Check if session is already active or handle query messages
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const nextUrl = searchParams.get("next") || "/admin/dashboard";
        router.replace(nextUrl);
      }
    });
  }, [router, searchParams]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedIdentifier = employeeId.trim();
    if (!trimmedIdentifier) {
      setErrorMessage("Please enter your Employee ID or Institutional Email.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your account password.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }

      // Format identifier to valid email format accepted by Supabase Auth
      const loginEmail = normalizeEmployeeIdentifier(trimmedIdentifier);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        // Helpful message if user doesn't exist yet or invalid password
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage(
            `Authentication failed. Please verify Employee ID / Email (${loginEmail}) and Password. If this account is not yet created in Supabase Auth, register or seed it in Supabase Auth.`
          );
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMessage("Authentication successful. Establishing secure session...");
        
        // Save role preference in sessionStorage for dashboard simulation if needed
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("sgi_preferred_role", selectedRole);
        }

        const nextUrl = searchParams.get("next") || "/admin/dashboard";
        setTimeout(() => {
          router.replace(nextUrl);
        }, 600);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setEmployeeId(preset.employeeId);
    setSelectedRole(preset.role);
    setPassword("Sanjeevan@2026");
    setErrorMessage(null);
  };

  return (
    <div className="admin-login-shell">
      {/* Dynamic Ambient Glows */}
      <div className="auth-ambient-glow glow-blue" />
      <div className="auth-ambient-glow glow-crimson" />
      <div className="auth-ambient-glow glow-navy" />

      {/* LEFT PANE — Full-Height Campus Aerial & Brand Identity */}
      <motion.aside
        className="login-hero-pane"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top Header */}
        <div className="hero-brand-top">
          <div className="hero-logo-badge">
            <Image
              src="/logo.png"
              alt="Sanjeevan Group of Institutions Logo"
              width={46}
              height={46}
              className="hero-logo-img"
              priority
            />
          </div>
          <div className="hero-brand-title">
            <span>Holy-Wood Academy • Panhala</span>
            <strong>SANJEEVAN GROUP OF INSTITUTIONS</strong>
          </div>
        </div>

        {/* Center Prominence */}
        <div className="hero-center-content">
          <motion.div
            className="autonomous-badge"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="autonomous-badge-pulse" />
            Autonomous Engineering Institute
          </motion.div>

          <motion.h1
            className="hero-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Administrative &amp; Academic <span>Command Center</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            A high-assurance administrative portal for authorized faculty, academic leadership,
            and administrative staff of Sanjeevan Knowledge City, Kolhapur.
          </motion.p>

          {/* Accreditation Badges: AICTE • BATU • NAAC */}
          <motion.div
            className="accreditation-strip"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <div className="acc-pill highlight">
              <Award size={15} />
              <span>AICTE Approved</span>
            </div>
            <div className="acc-pill">
              <School size={15} />
              <span>BATU Affiliated</span>
            </div>
            <div className="acc-pill highlight">
              <GraduationCap size={15} />
              <span>NAAC &apos;A+&apos; Grade</span>
            </div>
          </motion.div>

          {/* Security Standards Strip */}
          <motion.div
            className="security-metrics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <div className="metric-item">
              <strong>
                <ShieldCheck size={14} /> 256-Bit TLS
              </strong>
              <span>Encrypted Transit</span>
            </div>
            <div className="metric-item">
              <strong>
                <UserCheck size={14} /> 5-Tier RBAC
              </strong>
              <span>Strict Role Isolation</span>
            </div>
            <div className="metric-item">
              <strong>
                <Lock size={14} /> Row-Level
              </strong>
              <span>PostgreSQL Security</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Footer */}
        <div className="hero-footer-bar">
          <div>
            <strong>Sanjeevan Knowledge City</strong> · Somwar Peth, Panhala
          </div>
          <div>Security Compliance: v2.4 Active</div>
        </div>
      </motion.aside>

      {/* RIGHT PANE — Glassmorphism Login Card */}
      <section className="login-card-pane">
        <motion.div
          className="login-glass-card"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="card-top-accent" />

          {/* Card Header */}
          <div className="login-card-header">
            <div className="security-kicker">
              <Shield size={13} />
              Ultra Secure Staff Portal
            </div>
            <h2 className="login-card-title">Staff Sign In</h2>
            <p className="login-card-subtitle">
              Enter your institutional credentials or Employee ID to authenticate your session.
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                className="auth-alert-box auth-alert-error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                className="auth-alert-box auth-alert-success"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Form */}
          <form onSubmit={handleLogin} className="auth-form" noValidate>
            {/* Employee ID / Email */}
            <div className="form-field">
              <label className="field-label" htmlFor="employee-id">
                <span>Employee ID / Staff Email</span>
                <span className="field-badge">e.g. SAN-ADM-001</span>
              </label>
              <div className="input-container">
                <input
                  id="employee-id"
                  type="text"
                  className="auth-input"
                  placeholder="Enter employee ID or email..."
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
                <Mail size={16} className="input-icon-left" />
              </div>
            </div>

            {/* Password */}
            <div className="form-field">
              <label className="field-label" htmlFor="password">
                <span>Password</span>
                <span className="field-badge">Confidential</span>
              </label>
              <div className="input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Enter your security password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <KeyRound size={16} className="input-icon-left" />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
            <div className="form-options-bar">
              <label className="remember-label">
                <input
                  type="checkbox"
                  className="remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember this workstation</span>
              </label>

              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setForgotModalOpen(true)}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button with Luxury Motion */}
            <motion.button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
            >
              {isLoading ? (
                <>
                  <RotateCw size={17} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Authenticate &amp; Open Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Role Preset Evaluator / Demo Helper */}
          <div className="demo-accounts-card">
            <button
              type="button"
              className="demo-header-toggle"
              onClick={() => setShowRoleHelper(!showRoleHelper)}
            >
              <span>Quick Role Credentials Helper</span>
              <span>{showRoleHelper ? "Hide ▲" : "Show ▼"}</span>
            </button>

            {showRoleHelper && (
              <motion.div
                className="role-pill-grid"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.role}
                    type="button"
                    className="role-preset-btn"
                    onClick={() => applyPreset(preset)}
                  >
                    <strong>{preset.label}</strong>
                    <span>ID: {preset.employeeId}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Return to Public Website */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <Link
              href="/"
              style={{
                color: "#94a3b8",
                fontSize: "11px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none",
              }}
            >
              ← Return to Sanjeevan Public Portal
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <motion.div
            className="auth-modal-window"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <strong style={{ fontSize: "16px", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color="#c62828" /> Password Reset Assistance
              </strong>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.6, marginBottom: "16px" }}>
              In accordance with Sanjeevan autonomous institutional security protocols, passwords for administrative,
              HOD, and faculty accounts are protected under centralized Supabase Authentication.
            </p>
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#93c5fd", fontWeight: 700, marginBottom: "4px" }}>
                Institutional IT Helpdesk
              </div>
              <div style={{ fontSize: "12px", color: "#ffffff" }}>
                Email: it-admin@sanjeevan.edu.in
              </div>
              <div style={{ fontSize: "12px", color: "#ffffff" }}>
                Internal Extension: +91 231 234 5678 (Ext 104)
              </div>
            </div>
            <button
              type="button"
              className="login-submit-btn"
              onClick={() => setForgotModalOpen(false)}
              style={{ height: "40px" }}
            >
              Return to Login
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="admin-login-shell"
          style={{
            display: "grid",
            placeItems: "center",
            color: "#ffffff",
            fontSize: "14px",
          }}
        >
          Loading Secure Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
