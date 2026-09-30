import type { User } from "@supabase/supabase-js";
import type { AdminRole, AdminUser, RoleCapability } from "./auth-types";

export const ROLE_CAPABILITIES: Record<AdminRole, RoleCapability> = {
  "Super Admin": {
    role: "Super Admin",
    description: "Full institutional administration, user management, system configs & CMS",
    accessLevel: "full",
    allowedSections: [
      "Dashboard",
      "Leadership Manager",
      "Popup Manager",
      "Quick Links Manager",
      "Navigation Manager",
      "Department Manager",
      "News Manager",
      "Event Manager",
      "Download Manager",
      "Hero Content Manager",
    ],
  },
  "Principal": {
    role: "Principal",
    description: "Academic leadership, institutional approvals, faculty & student oversight",
    accessLevel: "high",
    allowedSections: [
      "Dashboard",
      "Leadership Manager",
      "Popup Manager",
      "Quick Links Manager",
      "Navigation Manager",
      "Department Manager",
      "News Manager",
      "Event Manager",
      "Download Manager",
      "Hero Content Manager",
    ],
  },
  "HOD": {
    role: "HOD",
    description: "Departmental operations, branch notices, faculty syllabus & student progress",
    accessLevel: "moderate",
    allowedSections: [
      "Dashboard",
      "Department Manager",
      "News Manager",
    ],
  },
  "Teacher": {
    role: "Teacher",
    description: "Class assignments, student attendance, continuous evaluations & study material",
    accessLevel: "moderate",
    allowedSections: [
      "Dashboard",
      "News Manager",
    ],
  },
  "Office Staff": {
    role: "Office Staff",
    description: "Student documentation, admissions verification, fees & verification circulars",
    accessLevel: "basic",
    allowedSections: [
      "Dashboard",
      "Download Manager",
    ],
  },
};

export function normalizeEmployeeIdentifier(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  // Sanitize employee ID
  const cleanId = trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `${cleanId}@sanjeevan.edu.in`;
}

export function parseRole(rawRole?: string | null): AdminRole {
  if (!rawRole) return "Super Admin";
  const r = rawRole.trim().toLowerCase();
  if (r.includes("super") || r === "admin") return "Super Admin";
  if (r.includes("principal")) return "Principal";
  if (r.includes("hod") || r.includes("head")) return "HOD";
  if (r.includes("teacher") || r.includes("faculty") || r.includes("professor") || r === "editor") return "Teacher";
  if (r.includes("office") || r.includes("staff") || r.includes("clerk")) return "Office Staff";
  return "Super Admin";
}

export function buildAdminProfile(user: User, dbRole?: string | null): AdminUser {
  const meta = user.user_metadata || {};
  const email = user.email || "";
  const role = (meta.role as AdminRole) || parseRole(dbRole || meta.role);

  let employeeId = meta.employee_id || meta.employeeId;
  if (!employeeId) {
    if (email.endsWith("@sanjeevan.edu.in")) {
      employeeId = email.replace("@sanjeevan.edu.in", "").toUpperCase();
    } else {
      employeeId = `SGI-${user.id.slice(0, 5).toUpperCase()}`;
    }
  }

  const name =
    meta.full_name ||
    meta.name ||
    (email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Staff Member");

  return {
    id: user.id,
    email,
    employeeId,
    name,
    role,
    department: meta.department || "Academic Administration",
    avatarUrl: meta.avatar_url,
    phone: meta.phone,
  };
}
