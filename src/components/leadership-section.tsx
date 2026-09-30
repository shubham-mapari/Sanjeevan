"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Mail, X } from "lucide-react";
import { RichContent } from "@/components/rich-content";
import type { Leader } from "@/lib/leaders-data";
import "@/app/leadership.css";

function messagePreview(document: Leader["message"]): string {
  function collect(nodes: typeof document.content): string {
    return (nodes ?? [])
      .map((node) => node.text ?? collect(node.content))
      .filter(Boolean)
      .join(" ");
  }

  return collect(document.content).replace(/\s+/g, " ").trim();
}

export function LeadershipSection({ leaders }: { leaders: Leader[] }) {
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);

  useEffect(() => {
    if (!selectedLeader) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedLeader(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedLeader]);

  if (leaders.length === 0) return null;

  return (
    <section className="leadership-section section-pad" aria-labelledby="leadership-title">
      <div className="page-wrap">
        <div className="leadership-heading">
          <span className="eyebrow">
            <span className="eyebrow-line" /> Leadership &amp; Vision
          </span>
          <h2 id="leadership-title">Guided by purpose. <em>Rooted in possibility.</em></h2>
          <p>Meet the people shaping our institution and its future.</p>
        </div>

        <div
          className={`leadership-grid${leaders.length === 1 ? " leadership-grid-single" : ""}`}
        >
          {leaders.map((leader, index) => (
            <motion.article
              className="leader-card"
              key={leader.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
              whileHover={{ y: -5 }}
            >
              <div className="leader-photo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="leader-photo" src={leader.photo_url} alt={leader.name} loading="lazy" />
              </div>
              <span className="leader-designation">{leader.designation}</span>
              <h3>{leader.name}</h3>
              <p className="leader-message-title">{leader.message_title}</p>
              <p className="leader-preview">{messagePreview(leader.message)}</p>
              <button
                className="leader-read-button"
                type="button"
                onClick={() => setSelectedLeader(leader)}
              >
                Read full message <ArrowUpRight size={16} />
              </button>
            </motion.article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedLeader && (
          <motion.div
            className="leader-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedLeader(null);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              aria-labelledby="leader-modal-title"
              aria-modal="true"
              className="leader-modal"
              role="dialog"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="leader-modal-close"
                type="button"
                aria-label="Close message"
                onClick={() => setSelectedLeader(null)}
              >
                <X size={19} />
              </button>
              <div className="leader-modal-heading">
                <div className="leader-photo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="leader-photo" src={selectedLeader.photo_url} alt={selectedLeader.name} />
                </div>
                <div>
                  <span className="leader-designation">{selectedLeader.designation}</span>
                  <h2 id="leader-modal-title">{selectedLeader.name}</h2>
                  <p>{selectedLeader.message_title}</p>
                </div>
              </div>
              <div className="leader-full-message">
                <RichContent document={selectedLeader.message} />
              </div>
              {selectedLeader.signature_url && (
                <div className="leader-signature">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedLeader.signature_url} alt={`${selectedLeader.name}'s signature`} />
                </div>
              )}
              {selectedLeader.email && (
                <a className="leader-email" href={`mailto:${selectedLeader.email}`}>
                  <Mail size={15} /> {selectedLeader.email}
                </a>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}