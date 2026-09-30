import {
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  CtaBanner,
  Reveal,
  StatStrip,
} from "@/components/sections";
import { HeroSlider } from "@/components/hero-slider";
import { getPublishedHeroSlides } from "@/lib/hero-slides-data";
import { QuickLinksSlider } from "@/components/quick-links-slider";
import { getPublishedQuickLinks } from "@/lib/quick-links-data";
import { DynamicDepartmentsSection } from "@/components/departments-section";
import { getPublishedDepartments } from "@/lib/departments-data";
import { LeadershipSection } from "@/components/leadership-section";
import { getPublishedLeaders } from "@/lib/leaders-data";
import { CampusContentSection } from "@/components/campus-content-section";
import { CampusVisitSection } from "@/components/campus-visit-section";
import { VoiceAssistantSection } from "@/components/voice-assistant-section";
import { HomepagePopup } from "@/components/homepage-popup";
import { getPublishedPopupBanner } from "@/lib/popup-banners";
import "./voice-assistant.css";

export default async function Home() {
  const [slides, publishedDepartments, leaders, popupBanner, quickLinks] = await Promise.all([
    getPublishedHeroSlides(),
    getPublishedDepartments(),
    getPublishedLeaders(),
    getPublishedPopupBanner(),
    getPublishedQuickLinks(),
  ]);

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-photo" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content page-wrap">
          <Reveal className="hero-copy">
            <span className="eyebrow eyebrow-light">
              <span className="eyebrow-line" /> Holy-Wood Academy, Kolhapur
            </span>
            <h1 id="hero-title">
              Sanjeevan Group
              <br />
              of <span>Institutions</span>
            </h1>
            <p className="hero-place">Panhala, Kolhapur</p>
            <p className="hero-description">
              An autonomous engineering institute shaping curious minds into
              thoughtful engineers and leaders.
            </p>
            <div className="hero-actions">
              <Link className="button button-gold" href="/admission">
                Explore admissions <ArrowUpRight size={17} />
              </Link>
              <Link className="button button-ghost" href="/gallery">
                <span className="play-icon">↗</span> Discover our campus
              </Link>
            </div>
            <div className="recognition-row" aria-label="Institute recognition">
              <span>
                <i>AICTE</i> Approved
              </span>
              <b />
              <span>
                <i>BATU</i> Affiliated
              </span>
              <b />
              <span>
                <i>NAAC</i> Accredited
              </span>
            </div>
          </Reveal>
          <div className="hero-index">
            <span>01</span>
            <i /> A campus built for what&apos;s next
          </div>
        </div>
        <Link className="hero-scroll" href="#discover">
          <span /> Scroll to discover
        </Link>
        <div className="hero-coordinates">
          16°48&apos; N &nbsp; 74°06&apos; E
        </div>
      </section>
      <section
        className="stats-band"
        id="discover"
        aria-label="Institute at a glance"
      >
        <div className="page-wrap stats-grid">
          <StatStrip
            number="5,000+"
            label="Students"
            detail="A thriving community"
          />
          <StatStrip
            number="25+"
            label="Programs"
            detail="Paths to your future"
          />
          <StatStrip
            number="95%"
            label="Placement support"
            detail="Industry-ready graduates"
          />
          <StatStrip
            number="30+"
            label="Years of learning"
            detail="A legacy with momentum"
          />
        </div>
      </section>
      <QuickLinksSlider items={quickLinks} />
      <HeroSlider slides={slides} />
      <DynamicDepartmentsSection initialDepartments={publishedDepartments} />
      <LeadershipSection leaders={leaders} />
      <CampusContentSection />
      <CampusVisitSection />
      <VoiceAssistantSection />
      <CtaBanner />
      <HomepagePopup banner={popupBanner} />
    </main>
  );
}
