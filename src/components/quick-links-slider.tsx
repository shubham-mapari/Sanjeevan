"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { QuickLink } from "@/lib/quick-links-data";

export function QuickLinksSlider({ items }: { items: QuickLink[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const firstCard = track.querySelector<HTMLElement>(".quick-link-card");
      if (!firstCard) return;
      const styles = window.getComputedStyle(track);
      setStep(firstCard.getBoundingClientRect().width + (Number.parseFloat(styles.columnGap) || 0));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (hovered || dragging || focused || items.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      2000,
    );
    return () => window.clearInterval(timer);
  }, [dragging, focused, hovered, items.length]);

  if (!items.length) return null;

  function move(direction: -1 | 1) {
    if (items.length < 2) return;
    setIndex((current) => (current + direction + items.length) % items.length);
  }

  function endDrag(_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) {
    setDragging(false);
    if (step > 0) {
      const moved = Math.round(-info.offset.x / step);
      if (moved) {
        setIndex((current) => (current + moved % items.length + items.length) % items.length);
      }
    }
  }

  return (
    <motion.section
      className="quick-links-window"
      aria-label="Homepage quick links"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.45 }}
    >
      <div className="quick-links-window-head page-wrap">
        <h2>Quick links</h2>
        <div className="quick-links-window-controls">
          <button type="button" aria-label="Previous quick links" disabled={items.length < 2} onClick={() => move(-1)}><ArrowLeft size={16} /></button>
          <button type="button" aria-label="Next quick links" disabled={items.length < 2} onClick={() => move(1)}><ArrowRight size={16} /></button>
        </div>
      </div>
      <div
        className="quick-links-window-viewport"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <motion.div
          ref={trackRef}
          className="quick-links-window-track"
          drag={items.length > 1 ? "x" : false}
          dragConstraints={{ left: -step * Math.max(0, items.length - 1), right: 0 }}
          dragElastic={0.06}
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDragEnd={endDrag}
          animate={{ x: -index * step }}
          transition={reducedMotion ? { duration: 0 } : { type: "tween", duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          {items.map((item) => (
            <Link className="quick-link-card" href={`/quick-links/${item.slug}`} key={item.id} draggable={false}>
              <Image src={item.thumbnail_url} alt="" width={250} height={130} unoptimized draggable={false} />
              <span>{item.title}</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
