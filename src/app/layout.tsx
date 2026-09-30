import type { Metadata } from "next";
import { SiteFooter, SiteNavbar } from "@/components/site";
import { getPublishedNavigation } from "@/lib/navigation-data";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default:
      "Sanjeevan Group of Institutions | Autonomous Engineering Institute",
    template: "%s | Sanjeevan Group of Institutions",
  },
  description:
    "Discover Sanjeevan Group of Institutions, an autonomous engineering institute in Panhala, Kolhapur. Explore programs, admissions, campus life and research.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const menus = await getPublishedNavigation();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <SiteNavbar menus={menus} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
