import { useEffect } from "react";

// Sets a per-route <title> and meta description — this SPA has one static
// index.html, so without this every route shares the same title/description.
// No new dependency: just the two DOM writes react-helmet-style libraries
// wrap, which is all a single static meta tag needs.
export function useDocumentMeta(title, description) {
  useEffect(() => {
    document.title = title;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);
}
