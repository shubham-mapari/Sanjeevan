"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  id: string;
  image_url: string;
  label: string | null;
  heading: string;
  highlight: string | null;
  description: string | null;
  quote: string | null;
  quote_author: string | null;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  image_ratio?: string | null;
};

// Framer Motion variants for smooth slide + fade transition
const imageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "5%" : "-5%",
    opacity: 0,
    scale: 1.03,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-5%" : "5%",
    opacity: 0,
    scale: 0.98,
  }),
};

const contentVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -30 : 30,
    opacity: 0,
  }),
};

const transition = { duration: 0.6, ease: [0.33, 1, 0.68, 1] as const };

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [[current, dir], setCurrent] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = slides.length;

  const goto = useCallback(
    (next: number, direction: number) => {
      const idx = ((next % total) + total) % total;
      setCurrent([idx, direction]);
    },
    [total],
  );

  const prev = useCallback(() => goto(current - 1, -1), [current, goto]);
  const next = useCallback(() => goto(current + 1, 1), [current, goto]);

  // Autoplay strictly every 2 seconds (paused while user hovers)
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      goto(current + 1, 1);
    }, 2000);
    return () => clearInterval(timer);
  }, [current, goto, total, isPaused]);

  // Mobile swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        next();
      } else {
        prev();
      }
    }
    touchStartX.current = null;
  };

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <section
      className="hs-section"
      aria-label="Hero content slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hs-inner page-wrap">
        {/* ── LEFT: Photo Frame (Exact photo ratio with dynamic auto-adjustment) ── */}
        <div className="hs-image-col">
          <div
            className="hs-image-frame"
            style={{ aspectRatio: slide.image_ratio || "4 / 4.5" }}
          >
            <AnimatePresence custom={dir} mode="sync">
              <motion.div
                key={slide.id + "-img"}
                custom={dir}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="hs-image-motion"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image_url}
                  alt={slide.heading}
                  className="hs-image"
                />
              </motion.div>
            </AnimatePresence>

            <div className="hs-accent-frame" aria-hidden="true" />

            {/* Floating gold button badge at bottom right */}
            {slide.button_text && (
              <Link
                href={slide.button_link || "/about-us"}
                className="hs-badge"
              >
                {slide.button_text}
              </Link>
            )}

            {/* Captions at bottom left */}
            <div className="hs-caption-wrap">
              <span className="hs-caption">PANHALA · MAHARASHTRA</span>
              {slide.label ? (
                <span className="hs-caption-secondary">{slide.label}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Content Column (Remaining space with description) ── */}
        <div className="hs-content-col">
          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={slide.id + "-content"}
              custom={dir}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="hs-content"
            >
              {/* Red line + uppercase kicker */}
              {slide.label && (
                <span className="hs-eyebrow">{slide.label}</span>
              )}

              {/* Main Heading + Highlight text */}
              <h2 className="hs-heading">
                {slide.heading}
                {slide.highlight && (
                  <em className="hs-highlight">{slide.highlight}</em>
                )}
              </h2>

              {/* Description Paragraph */}
              {slide.description && (
                <p className="hs-description">{slide.description}</p>
              )}

              {/* Action Link with gold underline */}
              {slide.button_text && (
                <div className="hs-cta-wrap">
                  <Link
                    className="hs-cta"
                    href={slide.button_link || "/about-us"}
                  >
                    {slide.button_text} <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              {/* Quote Block with 99 symbol */}
              {slide.quote && (
                <div className="hs-quote">
                  <span className="hs-quote-symbol" aria-hidden="true">“</span>
                  <div>
                    <p className="hs-quote-text">{slide.quote}</p>
                    {slide.quote_author && (
                      <span className="hs-quote-author">
                        {slide.quote_author}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls: Dots and Nav Arrows */}
          {total > 1 && (
            <div className="hs-controls">
              {/* Dot Indicators: active blue pill + gold circles */}
              <div
                className="hs-dots"
                role="tablist"
                aria-label="Slide indicators"
              >
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Slide ${i + 1}: ${s.heading}`}
                    className={`hs-dot ${i === current ? "hs-dot-active" : ""}`}
                    onClick={() => goto(i, i > current ? 1 : -1)}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className="hs-arrows">
                <button
                  className="hs-arrow"
                  onClick={prev}
                  aria-label="Previous slide"
                  type="button"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  className="hs-arrow"
                  onClick={next}
                  aria-label="Next slide"
                  type="button"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
