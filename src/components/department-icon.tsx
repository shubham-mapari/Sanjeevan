import React from "react";
import {
  Cpu,
  Sparkles,
  ArrowUpRight,
  MapPin,
  Lightbulb,
  Bot,
  Layers,
  Atom,
  Wrench,
  Compass,
  Code,
  Laptop,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Network,
  Radio,
  Binary,
  CircuitBoard,
  Zap,
} from "lucide-react";

export const ICON_OPTIONS = [
  { id: "cpu", label: "Processor (Cpu)", icon: Cpu },
  { id: "sparkles", label: "Sparkles / AI", icon: Sparkles },
  { id: "arrow-up-right", label: "Arrow Up Right", icon: ArrowUpRight },
  { id: "map-pin", label: "Map Pin / Infrastructure", icon: MapPin },
  { id: "lightbulb", label: "Lightbulb / Electrical", icon: Lightbulb },
  { id: "bot", label: "Robotics / Bot", icon: Bot },
  { id: "circuit-board", label: "Circuit Board", icon: CircuitBoard },
  { id: "laptop", label: "Laptop / Computing", icon: Laptop },
  { id: "code", label: "Code / Software", icon: Code },
  { id: "binary", label: "Binary Data", icon: Binary },
  { id: "network", label: "Network / Systems", icon: Network },
  { id: "wrench", label: "Wrench / Mechanical", icon: Wrench },
  { id: "atom", label: "Atom / Applied Science", icon: Atom },
  { id: "flask-conical", label: "Flask / Laboratory", icon: FlaskConical },
  { id: "zap", label: "Zap / Energy", icon: Zap },
  { id: "radio", label: "Radio / Telecommunications", icon: Radio },
  { id: "compass", label: "Compass / Design", icon: Compass },
  { id: "layers", label: "Layers / Architecture", icon: Layers },
  { id: "book-open", label: "Book Open / Academics", icon: BookOpen },
  { id: "graduation-cap", label: "Graduation Cap", icon: GraduationCap },
];

export function DepartmentIcon({
  nameOrUrl,
  size = 22,
  className = "",
  strokeWidth = 1.6,
}: {
  nameOrUrl?: string | null;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  if (!nameOrUrl) {
    return <Cpu size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Check if it's an image URL (PNG, SVG, HTTPS, data URL, or starts with /)
  if (
    nameOrUrl.startsWith("http://") ||
    nameOrUrl.startsWith("https://") ||
    nameOrUrl.startsWith("/") ||
    nameOrUrl.startsWith("data:")
  ) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={nameOrUrl}
        alt="Department Icon"
        style={{ width: size, height: size, objectFit: "contain" }}
        className={className}
      />
    );
  }

  const normalized = nameOrUrl.toLowerCase().trim();
  const matched = ICON_OPTIONS.find((opt) => opt.id === normalized);

  if (matched) {
    const Component = matched.icon;
    return <Component size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Fallback defaults
  if (normalized.includes("sparkle") || normalized.includes("ai")) {
    return <Sparkles size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes("light") || normalized.includes("electric")) {
    return <Lightbulb size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes("pin") || normalized.includes("civil")) {
    return <MapPin size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes("robot") || normalized.includes("auto")) {
    return <Bot size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes("mech") || normalized.includes("arrow")) {
    return <ArrowUpRight size={size} strokeWidth={strokeWidth} className={className} />;
  }

  return <Cpu size={size} strokeWidth={strokeWidth} className={className} />;
}
