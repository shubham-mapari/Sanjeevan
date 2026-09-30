"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import type { PopupBanner } from "@/lib/popup-banners";
import "@/app/popup-banner.css";

export function PopupBannerModal({
  banner,
  onClose,
}: {
  banner: PopupBanner | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!banner) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [banner, onClose]);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          className="popup-banner-backdrop"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="popup-banner-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`popup-banner-title-${banner.id}`}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            transition={transition}
          >
            <h2 className="popup-banner-visually-hidden" id={`popup-banner-title-${banner.id}`}>
              {banner.title}
            </h2>
            <button
              className="popup-banner-close"
              type="button"
              onClick={onClose}
              aria-label="Close popup"
              title="Close popup"
            >
              <X size={20} />
            </button>
            {banner.redirect_url ? (
              <a
                className="popup-banner-image-link"
                href={banner.redirect_url}
                target={banner.open_new_tab ? "_blank" : undefined}
                rel={banner.open_new_tab ? "noopener noreferrer" : undefined}
                aria-label={`${banner.title} (opens ${banner.open_new_tab ? "in a new tab" : "link"})`}
              >
                <Image
                  className="popup-banner-image"
                  src={banner.image_url}
                  alt={banner.title}
                  width={1400}
                  height={900}
                  sizes="(max-width: 600px) 92vw, 700px"
                  unoptimized
                />
              </a>
            ) : (
              <Image
                className="popup-banner-image"
                src={banner.image_url}
                alt={banner.title}
                width={1400}
                height={900}
                sizes="(max-width: 600px) 92vw, 700px"
                unoptimized
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}