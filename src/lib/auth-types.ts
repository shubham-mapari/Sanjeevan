export type AdminRole =
  | "Super Admin"
  | "Principal"
  | "HOD"
  | "Teacher"
  | "Office Staff";

export type AdminUser = {
  id: string;
  email: string;
  employeeId: string;
  name: string;
  role: AdminRole;
  department?: string;
  avatarUrl?: string;
  phone?: string;
};

export interface RoleCapability {
  role: AdminRole;
  description: string;
  accessLevel: "full" | "high" | "moderate" | "basic";
  allowedSections: string[];
}
