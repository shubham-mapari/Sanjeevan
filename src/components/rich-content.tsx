import { createElement, type ReactNode } from "react";
import type { RichDocument, RichNode } from "@/lib/navigation-types";

function safeHref(value: unknown) {
  if (typeof value !== "string") return undefined;
  if ((value.startsWith("/") && !value.startsWith("//")) || /^(https?:|mailto:|tel:)/i.test(value))
    return value;
  return undefined;
}

function renderNode(node: RichNode, key: number): ReactNode {
  if (node.type === "text") {
    let text: ReactNode = node.text ?? "";
    for (const mark of [...(node.marks ?? [])].reverse()) {
      if (mark.type === "bold")
        text = createElement("strong", { key: `${key}-b` }, text);
      else if (mark.type === "italic")
        text = createElement("em", { key: `${key}-i` }, text);
      else if (mark.type === "strike")
        text = createElement("s", { key: `${key}-s` }, text);
      else if (mark.type === "code")
        text = createElement("code", { key: `${key}-c` }, text);
      else if (mark.type === "link") {
        const href = safeHref(mark.attrs?.href);
        if (href)
          text = createElement(
            "a",
            {
              key: `${key}-a`,
              href,
              rel: href.startsWith("http") ? "noreferrer" : undefined,
            },
            text,
          );
      }
    }
    return text;
  }

  if (node.type === "image") {
    const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
    const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "Article illustration";
    const title = typeof node.attrs?.title === "string" ? node.attrs.title : undefined;
    if (!src) return null;
    return createElement(
      "figure",
      { key, className: "rich-image-figure" },
      createElement("img", {
        src,
        alt,
        title,
        className: "rich-content-image",
        loading: "lazy",
      }),
      title ? createElement("figcaption", { className: "rich-image-caption" }, title) : null,
    );
  }

  const children = node.content?.map((child, index) =>
    renderNode(child, index),
  );
  if (node.type === "hardBreak") return createElement("br", { key });
  if (node.type === "horizontalRule") return createElement("hr", { key });
  const level = Number(node.attrs?.level);
  const tag =
    node.type === "heading"
      ? `h${level >= 2 && level <= 4 ? level : 2}`
      : node.type === "bulletList"
        ? "ul"
        : node.type === "orderedList"
          ? "ol"
          : node.type === "listItem"
            ? "li"
            : node.type === "blockquote"
              ? "blockquote"
              : node.type === "codeBlock"
                ? "pre"
                : node.type === "paragraph"
                  ? "p"
                  : null;
  return tag
    ? createElement(tag, { key }, children)
    : createElement("span", { key }, children);
}

export function RichContent({ document }: { document: RichDocument }) {
  return (
    <div className="rich-content">
      {document.content?.map((node, index) => renderNode(node, index))}
    </div>
  );
}
