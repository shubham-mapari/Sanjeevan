import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin Portal | Sanjeevan Group of Institutions",
  description: "Secure Administrative Command Center for Sanjeevan Group of Institutions",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
