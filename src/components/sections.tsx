"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Reveal({
  children,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
}) {
  const reducedMotion = useReducedMotion();
  const offsets = { up: { y: 22 }, left: { x: -26 }, right: { x: 26 } };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reducedMotion ? 0 : 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  kicker,
  title,
}: {
  kicker: string;
  title: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">
        <span className="eyebrow-line" /> {kicker}
      </span>
      <h2>{title}</h2>
    </div>
  );
}

export function StatStrip({
  number,
  label,
  detail,
}: {
  number: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="stat-item">
      <strong>{number}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  );
}

export function ImageTile({
  title,
  place,
  image,
  size,
  index,
}: {
  title: string;
  place: string;
  image: string;
  size: string;
  index: number;
}) {
  return (
    <Link className={`gallery-tile ${size}`} href="/gallery">
      <div
        className="gallery-tile-bg"
        style={{
          backgroundImage: `url('https://images.unsplash.com/${image}?auto=format&fit=crop&w=1000&q=80')`,
        }}
      />
      <span className="gallery-tile-index">0{index + 1}</span>
      <div className="gallery-tile-copy">
        <small>{place}</small>
        <strong>{title}</strong>
      </div>
    </Link>
  );
}

export function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="page-wrap cta-inner">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> Your future, in motion
          </span>
          <h2>There&apos;s a place for you at Sanjeevan.</h2>
        </div>
        <Link className="button" href="/admission">
          Start your journey <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  );
}

export function DetailCta({
  title,
  href = "/admission",
  label = "Take the next step",
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="detail-cta">
      <div>
        <span className="eyebrow">
          <span className="eyebrow-line" /> Sanjeevan Group of Institutions
        </span>
        <h2>{title}</h2>
      </div>
      <Link className="button button-navy" href={href}>
        {label} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
