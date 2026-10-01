"use client";

/**
 * AdminShell — shared sidebar wrapper used by every CMS admin page.
 *
 * Usage:
 *   <AdminShell currentSection="news">
 *     {page content}
 *   </AdminShell>
 *
 * currentSection must match one of the ADMIN_NAV_ITEMS id values so
 * the active item is highlighted correctly.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Download,
  LayoutDashboard,
  Link2,
  ListTree,
  LogOut,
  Newspaper,
  Image as ImageIcon,
  Sliders,
  Users,
} from "lucide-react";
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import "@/app/admin/campus-content-admin.css";

const B = ADMIN_BASE_PATH;

export const ADMIN_NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",            icon: LayoutDashboard, href: `${B}/dashboard` },
  { id: "departments",  label: "Department Manager",   icon: Building2,       href: `${B}/departments` },
  { id: "leadership",   label: "Leadership Manager",   icon: Users,           href: `${B}/leadership` },
  { id: "news",         label: "News Manager",         icon: Newspaper,       href: `${B}/news` },
  { id: "events",       label: "Event Manager",        icon: CalendarDays,    href: `${B}/events` },
  { id: "downloads",    label: "Download Manager",     icon: Download,        href: `${B}/downloads` },
  { id: "quick-links",  label: "Quick Links Manager",  icon: Link2,           href: `${B}/quick-links` },
  { id: "navigation",   label: "Navigation Manager",   icon: ListTree,        href: `${B}/navigation` },
  { id: "hero",         label: "Hero Content Manager", icon: Sliders,         href: `${B}/hero` },
  { id: "popup-manager",label: "Popup Manager",        icon: ImageIcon,       href: `${B}/popup-manager` },
] as const;

export type AdminSection = (typeof ADMIN_NAV_ITEMS)[number]["id"];

export function AdminShell({
  children,
  currentSection,
}: {
  children: ReactNode;
  currentSection?: AdminSection;
}) {
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = ADMIN_LOGIN_PATH;
  }

  return (
    <div className="campus-cms-layout">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="campus-cms-sidebar">
        <Link className="campus-cms-brand" href={`${B}/dashboard`}>
          <span>SG</span>
          <strong>
            SANJEEVAN<br />
            <small>ADMINISTRATION</small>
          </strong>
        </Link>

        <span className="campus-cms-nav-label">CONTENT MANAGEMENT</span>

        <nav aria-label="Admin navigation">
          {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
            const active =
              currentSection === id ||
              (!currentSection && pathname === href) ||
              (id !== "dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={id}
                href={href}
                className={active ? "is-current" : ""}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid #e6e9ef", paddingTop: 10 }}>
          <Link className="campus-cms-back" href="/" target="_blank" style={{ borderTop: "none" }}>
            <ArrowUpRight size={14} /> View website
          </Link>
          <button
            type="button"
            className="campus-cms-back"
            style={{ cursor: "pointer", background: "transparent", border: "none", font: "inherit", color: "#c62828", justifyContent: "flex-start" }}
            onClick={handleSignOut}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────── */}
      <div className="campus-cms-main">
        {children}
      </div>
    </div>
  );
}
