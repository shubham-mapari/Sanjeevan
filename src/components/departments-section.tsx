"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/sections";
import { DepartmentIcon } from "@/components/department-icon";
import { type Department, DEFAULT_DEPARTMENTS } from "@/lib/departments-data";
import "@/app/departments/departments.css";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function DynamicDepartmentsSection({
  initialDepartments = [],
}: {
  initialDepartments?: Department[];
}) {
  const [departments, setDepartments] = useState<Department[]>(
    initialDepartments.length > 0 ? initialDepartments : DEFAULT_DEPARTMENTS
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchDepartments() {
      try {
        const res = await fetch("/api/departments", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.departments && data.departments.length > 0) {
          setDepartments(data.departments);
        }
      } catch (err) {
        console.error("Failed to load departments from API:", err);
      }
    }

    fetchDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      className="departments-section section-pad section-paper"
      id="departments"
    >
      <div className="page-wrap">
        <div className="section-topline">
          <SectionHeading
            kicker="Find your field"
            title={
              <>
                Make something
                <br />
                <em>that matters.</em>
              </>
            }
          />
          <p className="section-aside">
            Explore a rigorous, practical education across engineering and
            technology, with space to follow what fascinates you.
          </p>
        </div>

        {/* Dynamic CMS Grid */}
        <motion.div
          className="dynamic-dept-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {departments.map((dept, index) => {
            const formattedIndex = String(index + 1).padStart(2, "0");
            const themeClass = `theme-${dept.theme || "blue"}`;

            return (
              <motion.div key={dept.id || dept.slug} variants={cardVariants}>
                <Link
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
              </motion.div>
            );
          })}
        </motion.div>

        <Link className="text-link departments-more" href="/programs-offered">
          View all programs <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
