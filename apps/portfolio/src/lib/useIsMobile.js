import { useState, useEffect } from "react";

// Below Tailwind's `md` breakpoint — matches the stacking breakpoint used
// elsewhere in these pages (sm:flex-row etc.), just one step up: phones,
// not just the narrowest phones.
const QUERY = "(max-width: 767px)";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
