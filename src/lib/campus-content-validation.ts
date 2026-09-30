import type { ContentKind } from "@/lib/campus-content";

const fields: Record<ContentKind, string[]> = {
  news: [
    "title",
    "description",
    "image_url",
    "category",
    "publish_date",
    "is_new",
    "pdf_url",
    "display_order",
    "is_pinned",
    "published",
  ],
  events: [
    "title",
    "banner_url",
    "event_date",
    "venue",
    "description",
    "registration_link",
    "is_new",
    "display_order",
    "is_pinned",
    "published",
  ],
  downloads: [
    "title",
    "pdf_url",
    "file_size",
    "category",
    "is_new",
    "display_order",
    "is_pinned",
    "published",
  ],
};

const required: Record<ContentKind, string[]> = {
  news: ["title", "description", "category", "publish_date"],
  events: ["title", "banner_url", "event_date", "venue", "description"],
  downloads: ["title", "pdf_url", "category"],
};

const nullableStrings = new Set([
  "image_url",
  "banner_url",
  "pdf_url",
  "registration_link",
]);
const booleans = new Set(["is_new", "is_pinned", "published"]);
const dates = new Set(["publish_date", "event_date"]);

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateContentPayload(
  kind: ContentKind,
  value: unknown,
  partial = false,
): { payload?: Record<string, string | boolean | number | null>; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Provide valid content details." };
  }

  const body = value as Record<string, unknown>;
  const payload: Record<string, string | boolean | number | null> = {};
  for (const field of fields[kind]) {
    if (!(field in body)) continue;
    const entry = body[field];

    if (booleans.has(field)) {
      if (typeof entry !== "boolean") return { error: `${field} must be true or false.` };
      payload[field] = entry;
      continue;
    }

    if (field === "display_order") {
      if (!Number.isInteger(entry) || Number(entry) < 0) {
        return { error: "Display order must be a non-negative whole number." };
      }
      payload[field] = Number(entry);
      continue;
    }

    if (nullableStrings.has(field) && (entry === null || entry === undefined)) {
      payload[field] = null;
      continue;
    }

    if (typeof entry !== "string") return { error: `${field} must be text.` };
    const text = entry.trim();
    if (nullableStrings.has(field)) {
      payload[field] = text || null;
    } else {
      if (!text && (!partial || required[kind].includes(field))) {
        return { error: `${field} is required.` };
      }
      payload[field] = text;
    }

    if (dates.has(field) && text && !isValidDate(text)) {
      return { error: `${field} must be a valid date.` };
    }
  }

  if (!partial) {
    const missing = required[kind].find((field) => !(field in payload) || !payload[field]);
    if (missing) return { error: `${missing} is required.` };
  }

  return { payload };
}