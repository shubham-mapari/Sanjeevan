import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Compass,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Target,
  Users,
} from "lucide-react";
import {
  getAllDepartmentSlugs,
  getDepartmentBySlug,
} from "@/lib/departments-data";
import "@/app/departments/departments.css";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getAllDepartmentSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);

  if (!dept) {
    return { title: "Department Not Found | Sanjeevan" };
  }

  return {
    title: `${dept.name} (${dept.short_code}) | Sanjeevan Group of Institutions`,
    description:
      dept.description ||
      `Explore academic curriculum, laboratories, faculty, and career pathways in ${dept.name} at Sanjeevan.`,
    openGraph: {
      title: `${dept.name} (${dept.short_code})`,
      description: dept.description || undefined,
      images: dept.hero_image ? [dept.hero_image] : undefined,
    },
  };
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);

  if (!dept) {
    notFound();
  }

  const heroBg =
    dept.hero_image ||
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80";

  return (
    <main className="dept-detail-main">
      {/* 1. Hero Banner */}
      <section
        className="dept-hero"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="dept-hero-shade" />
        <div className="page-wrap dept-hero-inner">
          <div className="dept-hero-tags">
            <span className="dept-hero-tag badge-highlight">
              {dept.short_code}
            </span>
            {dept.intake && (
              <span className="dept-hero-tag">
                <Users size={13} /> {dept.intake}
              </span>
            )}
            {dept.duration && (
              <span className="dept-hero-tag">
                <Calendar size={13} /> {dept.duration}
              </span>
            )}
            <span className="dept-hero-tag">Autonomous Institute</span>
          </div>

          <h1>{dept.name}</h1>

          {dept.description && (
            <p className="dept-lead">{dept.description}</p>
          )}

          <div className="dept-hero-actions">
            <a href="#overview" className="button button-gold">
              Explore Overview <ArrowRight size={15} />
            </a>
            <a href="#syllabus" className="button button-ghost-light">
              <Download size={15} /> View Syllabus
            </a>
            <Link href="/" className="button button-ghost-light">
              <ArrowLeft size={15} /> All Departments
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky Secondary Navigation Bar */}
      <nav className="dept-nav-sticky">
        <div className="page-wrap dept-nav-wrap">
          <a href="#overview" className="dept-nav-item">
            Overview
          </a>
          {(dept.vision || dept.mission) && (
            <a href="#vision-mission" className="dept-nav-item">
              Vision & Mission
            </a>
          )}
          {dept.hod_name && (
            <a href="#hod" className="dept-nav-item">
              HOD Profile
            </a>
          )}
          {Boolean(dept.laboratories?.length) && (
            <a href="#laboratories" className="dept-nav-item">
              Laboratories
            </a>
          )}
          {Boolean(dept.faculty?.length) && (
            <a href="#faculty" className="dept-nav-item">
              Faculty
            </a>
          )}
          {Boolean(dept.syllabus?.length) && (
            <a href="#syllabus" className="dept-nav-item">
              Syllabus & PDFs
            </a>
          )}
          {Boolean(dept.placements?.top_companies?.length || dept.placements?.highest_package) && (
            <a href="#placements" className="dept-nav-item">
              Placements
            </a>
          )}
          {Boolean(dept.gallery?.length) && (
            <a href="#gallery" className="dept-nav-item">
              Gallery
            </a>
          )}
          <a href="#contact" className="dept-nav-item">
            Contact
          </a>
        </div>
      </nav>

      {/* 2. Department Overview */}
      <section className="dept-section" id="overview">
        <div className="page-wrap">
          <div className="dept-section-header">
            <span className="dept-section-kicker">Academic Foundation</span>
            <h2>Department Overview</h2>
          </div>
          <div style={{ maxWidth: 860, fontSize: 16, lineHeight: 1.85, color: "#334155" }}>
            <p>
              The Department of <strong>{dept.name}</strong> ({dept.short_code}) at Sanjeevan Group of Institutions provides comprehensive engineering education merging strong conceptual rigor with applied industrial problem solving.
            </p>
            <p style={{ marginTop: 14 }}>
              With an intake capacity of <strong>{dept.intake || "60 seats"}</strong> over a <strong>{dept.duration || "4-year duration"}</strong>, students undergo systematic training across foundational engineering sciences, specialized core courses, elective domains, and capstone interdisciplinary projects.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Vision & Mission */}
      {(dept.vision || dept.mission) && (
        <section className="dept-section dept-section-alt" id="vision-mission">
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Guiding Philosophy</span>
              <h2>Vision & Mission</h2>
            </div>
            <div className="vision-mission-grid">
              {dept.vision && (
                <div className="vm-card vm-card-vision">
                  <h3>
                    <Target size={24} color="#2563eb" /> Vision
                  </h3>
                  <p>{dept.vision}</p>
                </div>
              )}
              {dept.mission && (
                <div className="vm-card vm-card-mission">
                  <h3>
                    <Compass size={24} color="#c5342a" /> Mission
                  </h3>
                  <p>{dept.mission}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. HOD Profile */}
      {dept.hod_name && (
        <section className="dept-section" id="hod">
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Academic Leadership</span>
              <h2>Head of Department</h2>
            </div>
            <div className="hod-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  dept.hod_photo ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                }
                alt={dept.hod_name}
                className="hod-photo"
              />
              <div className="hod-info">
                <h3>{dept.hod_name}</h3>
                <span className="hod-role">
                  Head of Department &bull; {dept.name}
                </span>
                <p className="hod-quote">
                  &ldquo;Welcome to the Department of {dept.name}. We are dedicated to nurturing students with rigorous analytical training, human-centric design thinking, and strong ethical values. Our aim is to mold graduates ready to meet global challenges.&rdquo;
                </p>
                {dept.contact?.email && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#64748b" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Mail size={15} color="#c5342a" /> {dept.contact.email}
                    </span>
                    {dept.contact?.phone && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Phone size={15} color="#2563eb" /> {dept.contact.phone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Laboratories */}
      {Boolean(dept.laboratories && dept.laboratories.length > 0) && (
        <section className="dept-section dept-section-alt" id="laboratories">
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Applied Facilities</span>
              <h2>State-of-the-Art Laboratories</h2>
            </div>
            <div className="labs-grid">
              {dept.laboratories!.map((lab, index) => (
                <div className="lab-card" key={`${lab.name}-${index}`}>
                  <h4>{lab.name}</h4>
                  <p>{lab.description}</p>
                  <div className="lab-meta">
                    {lab.capacity && (
                      <span>
                        <strong>Capacity:</strong> {lab.capacity}
                      </span>
                    )}
                    {lab.incharge && (
                      <span>
                        <strong>In-Charge:</strong> {lab.incharge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Faculty Members */}
      {Boolean(dept.faculty && dept.faculty.length > 0) && (
        <section className="dept-section" id="faculty">
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Faculty Expertise</span>
              <h2>Distinguished Faculty</h2>
            </div>
            <div className="faculty-grid">
              {dept.faculty!.map((fac, idx) => (
                <div className="faculty-card" key={`${fac.name}-${idx}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      fac.photo ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    }
                    alt={fac.name}
                    className="faculty-img"
                  />
                  <strong>{fac.name}</strong>
                  <small className="role">{fac.designation}</small>
                  <span className="qual">{fac.qualification}</span>
                  <span className="exp">{fac.experience} Exp.</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Syllabus PDFs */}
      {Boolean(dept.syllabus && dept.syllabus.length > 0) && (
        <section className="dept-section dept-section-alt" id="syllabus">
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Curriculum & Documents</span>
              <h2>Syllabus & Schemes</h2>
            </div>
            <div className="syllabus-list">
              {dept.syllabus!.map((item, idx) => (
                <div className="syllabus-item" key={`${item.title}-${idx}`}>
                  <div className="syllabus-info">
                    <div className="syllabus-icon">
                      <FileText size={22} />
                    </div>
                    <div className="syllabus-text">
                      <strong>{item.title}</strong>
                      <span>
                        {item.semester} {item.file_size ? `• ${item.file_size}` : ""}
                      </span>
                    </div>
                  </div>
                  <a
                    href={item.url || "#"}
                    className="button button-navy"
                    download
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={14} /> Download PDF
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Placement Highlights */}
      {(dept.placements?.highest_package ||
        dept.placements?.top_companies?.length) && (
        <section className="dept-section" id="placements">
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Career Outcomes</span>
              <h2>Placement Highlights</h2>
            </div>
            <div className="placement-strip">
              <div className="placement-box">
                <strong>{dept.placements.highest_package || "₹12.0 LPA"}</strong>
                <span>Highest Package Secured</span>
              </div>
              <div className="placement-box">
                <strong>{dept.placements.average_package || "₹4.5 LPA"}</strong>
                <span>Average Package</span>
              </div>
              <div className="placement-box">
                <strong>{dept.placements.placed_percentage || "92%"}</strong>
                <span>Placement Success Rate</span>
              </div>
            </div>

            {dept.placements.top_companies && (
              <div>
                <h4 style={{ fontSize: 16, color: "#0b1f4d", marginBottom: 16, fontWeight: 700 }}>
                  Key Recruiting Partners
                </h4>
                <div className="recruiter-tags">
                  {dept.placements.top_companies.map((comp) => (
                    <span className="recruiter-badge" key={comp}>
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 9. Gallery */}
      {Boolean(dept.gallery && dept.gallery.length > 0) && (
        <section className="dept-section dept-section-alt" id="gallery">
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Campus Life</span>
              <h2>Department Gallery</h2>
            </div>
            <div className="dept-gallery-grid">
              {dept.gallery!.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={photo}
                  alt={`${dept.name} gallery image ${i + 1}`}
                  className="dept-gallery-item"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. Contact Section */}
      <section className="dept-section" id="contact">
        <div className="page-wrap">
          <div className="dept-section-header">
            <span className="dept-section-kicker">Get in Touch</span>
            <h2>Department Contact</h2>
          </div>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <MapPin size={20} />
              </div>
              <div>
                <strong>Office Location</strong>
                <p>
                  {dept.contact?.cabin ||
                    "Engineering Campus, Panhala, Kolhapur - 416201"}
                </p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Mail size={20} />
              </div>
              <div>
                <strong>Official Email</strong>
                <p>{dept.contact?.email || "info@sanjeevan.edu.in"}</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Clock size={20} />
              </div>
              <div>
                <strong>Working Hours</strong>
                <p>
                  {dept.contact?.office_hours ||
                    "Mon - Fri: 9:00 AM - 5:00 PM"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
