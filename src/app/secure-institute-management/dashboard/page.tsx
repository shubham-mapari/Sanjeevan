"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight, Building2, CalendarDays, ChevronDown, Download,
  Image as ImageIcon, Link2, LayoutDashboard, ListTree, LogOut,
  Newspaper, PanelLeftClose, PanelLeftOpen, ShieldCheck, Sliders, Users,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildAdminProfile, ROLE_CAPABILITIES } from "@/lib/auth-helpers";
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin-config";
import type { AdminUser } from "@/lib/auth-types";
import "@/app/admin/dashboard.css";

const B = ADMIN_BASE_PATH;

const SIDEBAR_ITEMS = [
  { id: "dashboard",   label: "Dashboard",            icon: LayoutDashboard, href: `${B}/dashboard` },
  { id: "departments", label: "Department Manager",   icon: Building2,       href: `${B}/departments`,   badge: "CMS", countKey: "departments" },
  { id: "leadership",  label: "Leadership Manager",   icon: Users,           href: `${B}/leadership`,    badge: "CMS", countKey: "leaders" },
  { id: "news",        label: "News Manager",         icon: Newspaper,       href: `${B}/news`,          badge: "CMS", countKey: "news" },
  { id: "quick-links", label: "Quick Links Manager",  icon: Link2,           href: `${B}/quick-links`,   badge: "CMS", countKey: "quickLinks" },
  { id: "events",      label: "Event Manager",        icon: CalendarDays,    href: `${B}/events`,        badge: "CMS", countKey: "events" },
  { id: "downloads",   label: "Download Manager",     icon: Download,        href: `${B}/downloads`,     badge: "CMS", countKey: "downloads" },
  { id: "navigation",  label: "Navigation Manager",   icon: ListTree,        href: `${B}/navigation`,    countKey: "navigation" },
  { id: "hero",        label: "Hero Content Manager", icon: Sliders,         href: `${B}/hero`,          countKey: "heroSlides" },
  { id: "popups",      label: "Popup Manager",        icon: ImageIcon,       href: `${B}/popup-manager`, badge: "CMS", countKey: "popupBanners" },
];

export default function SecureAdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | null> | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { router.replace(ADMIN_LOGIN_PATH); return; }

    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace(ADMIN_LOGIN_PATH);
    });

    void (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.replace(ADMIN_LOGIN_PATH); return; }

      const { data: adminRow } = await supabase
        .from("admin_users").select("role").eq("user_id", user.id).maybeSingle();

      if (!adminRow) {
        // Authenticated but not an admin
        router.replace(`${ADMIN_BASE_PATH}/access-denied`);
        return;
      }
      if (active) setProfile(buildAdminProfile(user, adminRow.role));
    })().catch(() => router.replace(ADMIN_LOGIN_PATH));

    return () => { active = false; authListener?.subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Could not load dashboard data."); return d as { counts: Record<string, number | null> }; })
      .then((d) => { if (active) setCounts(d.counts); })
      .catch((e: unknown) => { if (active) setCountsError(e instanceof Error ? e.message : "Could not load dashboard data."); });
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.replace(ADMIN_LOGIN_PATH);
  };

  const currentRoleCapability = useMemo(
    () => profile ? ROLE_CAPABILITIES[profile.role] || ROLE_CAPABILITIES["Super Admin"] : null,
    [profile],
  );

  const roleClassModifier = useMemo(() => {
    switch (profile?.role) {
      case "Super Admin": return "role-super-admin";
      case "Principal":   return "role-principal";
      case "HOD":         return "role-hod";
      default:            return "";
    }
  }, [profile?.role]);

  if (!profile || !currentRoleCapability) {
    return <main className="admin-dashboard-loading" role="status">Loading dashboard…</main>;
  }

  const allowedItems = SIDEBAR_ITEMS.filter((item) =>
    currentRoleCapability.allowedSections.includes(item.label),
  );

  return (
    <div className="admin-dashboard-shell">
      {isMobileOpen && <div className="mobile-drawer-backdrop" onClick={() => setIsMobileOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`dash-sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="dash-sidebar-brand">
          <div className="sidebar-logo-box">
            <Image src="/logo.png" alt="SGI Brand Mark" width={28} height={28} style={{ objectFit: "contain" }} />
          </div>
          {!isSidebarCollapsed && (
            <div className="sidebar-brand-text">
              <strong>SANJEEVAN PORTAL</strong>
              <small>Autonomous Institute</small>
            </div>
          )}
        </div>

        <div className="dash-sidebar-nav">
          {!isSidebarCollapsed && <div className="sidebar-section-title">Institutional Management</div>}
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.id !== "dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.id} href={item.href} className={`dash-nav-item ${isActive ? "active" : ""}`}
                onClick={() => { if (window.innerWidth <= 900) setIsMobileOpen(false); }}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && !isSidebarCollapsed && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </div>

        <div className="dash-sidebar-footer">
          <button type="button" className="dash-logout-btn" onClick={handleLogout} disabled={isSigningOut} title="Securely End Administrative Session">
            <LogOut size={16} />
            <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className={`dash-main-area ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <header className="dash-topbar">
          <div className="topbar-left">
            <button type="button" className="sidebar-toggle-btn"
              onClick={() => { if (window.innerWidth <= 900) setIsMobileOpen(!isMobileOpen); else setIsSidebarCollapsed(!isSidebarCollapsed); }}
              aria-label="Toggle Navigation Drawer"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <div className="topbar-right">
            <div className={`topbar-role-badge ${roleClassModifier}`}>
              <span className="role-pulse-dot" /><span>{profile.role}</span>
            </div>
            <div style={{ position: "relative" }}>
              <button type="button" className="topbar-user-pill" onClick={() => setUserDropdownOpen(!userDropdownOpen)} aria-expanded={userDropdownOpen} aria-label="Open account menu">
                <div className="topbar-avatar-circle">{profile.name.charAt(0)}</div>
                <div className="topbar-user-details">
                  <span className="topbar-user-name">{profile.name}</span>
                  <span className="topbar-user-email">{profile.employeeId}</span>
                </div>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: "4px" }} />
              </button>
              {userDropdownOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: "220px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 15px 35px rgba(0,0,0,0.12)", padding: "10px", zIndex: 50 }}>
                  <div style={{ padding: "8px", borderBottom: "1px solid #f1f5f9", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "12px", display: "block", color: "#0f172a" }}>{profile.name}</strong>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>{profile.email}</span>
                  </div>
                  <Link href={`${B}/navigation`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", fontSize: "11px", color: "#334155", textDecoration: "none", borderRadius: "6px" }} onClick={() => setUserDropdownOpen(false)}>
                    <ListTree size={14} /> Navigation Manager
                  </Link>
                  <button type="button" onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px", fontSize: "11px", color: "#c62828", border: "none", background: "transparent", borderRadius: "6px", cursor: "pointer", textAlign: "left" }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dash-body">
          <motion.section className="dash-welcome-banner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="welcome-info-pane">
              <h1>Welcome back, {profile.name}</h1>
              <p>{currentRoleCapability.description}</p>
            </div>
            <div className="welcome-stats-chip">
              <ShieldCheck size={23} color="#60a5fa" />
              <div><strong>{profile.role}</strong><span>{profile.department}</span></div>
            </div>
          </motion.section>

          {countsError && <p className="dashboard-data-error" role="alert">{countsError}</p>}

          <section className="dash-cards-grid" aria-label="CMS record totals">
            {allowedItems.filter((i) => i.id !== "dashboard").map((item, index) => {
              const Icon = item.icon;
              const count = item.countKey ? counts?.[item.countKey] : null;
              return (
                <motion.div className="dash-kpi-card" key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.25 }}>
                  <div className="card-top-row"><div className="card-icon-box card-icon-navy"><Icon size={20} /></div></div>
                  <div className="card-title-text">{item.label}</div>
                  <div className="card-value-display">{count == null ? (counts ? "Unavailable" : "—") : count.toLocaleString()}</div>
                  <div className="card-subtext">Records in this CMS</div>
                </motion.div>
              );
            })}
          </section>

          <section className="dash-panel dashboard-module-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title"><span>Content managers</span></div>
              <Link className="dashboard-public-link" href="/" target="_blank">View website <ArrowUpRight size={14} /></Link>
            </div>
            <div className="quick-action-list">
              {allowedItems.filter((i) => i.id !== "dashboard").map((item) => {
                const Icon = item.icon;
                return (
                  <Link href={item.href} className="quick-action-tile" key={item.id} onClick={() => setIsMobileOpen(false)}>
                    <Icon size={18} /><span>{item.label}</span><ArrowUpRight size={14} />
                  </Link>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
