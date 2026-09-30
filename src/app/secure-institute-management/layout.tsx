import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin Portal | Sanjeevan Group of Institutions",
  description: "Secure Administrative Command Center",
  robots: { index: false, follow: false },
};

export default function SecureAdminLayout({ children }: { children: ReactNode }) {
  return children;
}
