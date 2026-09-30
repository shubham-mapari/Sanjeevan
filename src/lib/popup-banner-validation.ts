import type { PopupBanner } from "@/lib/popup-banners";

export type PopupBannerPayload = {
  title?: string;
  image_url?: string;
  redirect_url?: string | null;
  open_new_tab?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  published?: boolean;
};

const booleanFields = new Set(["open_new_tab", "is_active", "published"]);
const dateFields = new Set(["start_date", "end_date"]);

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isRedirectUrl(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
  return isHttpUrl(value);
}

export function validatePopupBannerPayload(
  value: unknown,
  options: { partial?: boolean; existing?: Pick<PopupBanner, "start_date" | "end_date"> } = {},
): { payload?: PopupBannerPayload; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Provide valid popup details." };
  }

  const body = value as Record<string, unknown>;
  const payload: PopupBannerPayload = {};

  for (const field of [
    "title",
    "image_url",
    "redirect_url",
    "open_new_tab",
    "start_date",
    "end_date",
    "is_active",
    "published",
  ]) {
    if (!(field in body)) continue;
    const entry = body[field];

    if (booleanFields.has(field)) {
      if (typeof entry !== "boolean") return { error: `${field} must be true or false.` };
      payload[field as keyof PopupBannerPayload] = entry as never;
      continue;
    }

    if (dateFields.has(field)) {
      if (entry !== null && (typeof entry !== "string" || !isValidDate(entry))) {
        return { error: `${field.replace("_", " ")} must be a valid date.` };
      }
      payload[field as "start_date" | "end_date"] = entry as string | null;
      continue;
    }

    if (field === "redirect_url") {
      if (entry !== null && typeof entry !== "string") {
        return { error: "Redirect link must be a URL or empty." };
      }
      const link = typeof entry === "string" ? entry.trim() : "";
      if (link && !isRedirectUrl(link)) {
        return { error: "Redirect link must use http(s) or be a site-relative path." };
      }
      payload.redirect_url = link || null;
      continue;
    }

    if (typeof entry !== "string") return { error: `${field} must be text.` };
    const text = entry.trim();
    if (field === "title") {
      if (!text || text.length > 160) return { error: "Title is required and must be 160 characters or fewer." };
      payload.title = text;
    } else {
      if (!isHttpUrl(text)) return { error: "Popup image must be a valid http(s) URL." };
      payload.image_url = text;
    }
  }

  if (!options.partial && !payload.title) return { error: "Title is required." };
  if (!options.partial && !payload.image_url) return { error: "Popup image is required." };
  if (options.partial && Object.keys(payload).length === 0) {
    return { error: "Provide at least one popup field to update." };
  }

  const startDate = "start_date" in payload ? payload.start_date ?? null : options.existing?.start_date ?? null;
  const endDate = "end_date" in payload ? payload.end_date ?? null : options.existing?.end_date ?? null;
  if (startDate && endDate && startDate > endDate) {
    return { error: "End date must be on or after the start date." };
  }

  return { payload };
}