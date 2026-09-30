"use client";

import { useState } from "react";
import { PopupBannerModal } from "@/components/popup-banner-modal";
import type { PopupBanner } from "@/lib/popup-banners";

export function HomepagePopup({ banner }: { banner: PopupBanner | null }) {
  const [isOpen, setIsOpen] = useState(Boolean(banner));
  if (!banner || !isOpen) return null;
  return <PopupBannerModal banner={banner} onClose={() => setIsOpen(false)} />;
}