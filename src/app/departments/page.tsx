import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { DepartmentIcon } from "@/components/department-icon";
import { getPublishedDepartments } from "@/lib/departments-data";
import "@/app/departments/departments.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Academic Departments | Sanjeevan Group of Institutions",
  description:
    "Explore engineering and technology departments at Sanjeevan Group of Institutions, Panhala, Kolhapur.",
};

export default async function DepartmentsIndexPage() {
  const departments = await getPublishedDepartments();

  return (
    <main>
      <section className="inner-hero">
        <div className="page-wrap">
          <span className="eyebrow">
            <span className="eyebrow-line" /> Sanjeevan Group of Institutions
          </span>
          <h1>Academic Departments</h1>
          <div className="breadcrumb">
            <Link href="/">Home</Link> &nbsp; / &nbsp; Departments
          </div>
        </div>
      </section>

      <section className="section-pad section-paper">
        <div className="page-wrap">
          <div style={{ marginBottom: 36 }}>
            <Link href="/" className="text-link">
              <ArrowLeft size={16} /> Back to Homepage
            </Link>
          </div>

          <div className="dynamic-dept-grid">
            {departments.map((dept, index) => {
              const formattedIndex = String(index + 1).padStart(2, "0");
              const themeClass = `theme-${dept.theme || "blue"}`;

              return (
                <Link
                  key={dept.id || dept.slug}
                  className={`dynamic-dept-card ${themeClass}`}
                  href={`/departments/${dept.slug}`}
                >
                  <div className="dynamic-dept-top">
                    <span className="dynamic-dept-icon-wrap">
                      <DepartmentIcon
                        nameOrUrl={dept.icon_url}
                        size={22}
                        strokeWidth={1.7}
                      />
                    </span>
                    <span className="dynamic-dept-number">
                      {formattedIndex}
                    </span>
                  </div>

                  <span className="dynamic-dept-code">{dept.short_code}</span>
                  <h3 className="dynamic-dept-title">{dept.name}</h3>

                  {dept.description && (
                    <p className="dynamic-dept-desc">{dept.description}</p>
                  )}

                  <div className="dynamic-dept-link">
                    <span>{dept.button_text || "Explore Department"}</span>
                    <ArrowUpRight size={15} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
