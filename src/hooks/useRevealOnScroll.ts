import { RefObject, useEffect } from "react";

const SELECTOR = "section > .container, section > div > .container, [data-reveal]";

/**
 * Fades each section's content up as it scrolls into view, including sections
 * that appear later as data loads. Once per element; reduced motion is handled
 * in CSS (.reveal), which shows everything at once.
 */
export const useRevealOnScroll = (root: RefObject<HTMLElement>) => {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("reveal-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    const scan = () => {
      el.querySelectorAll<HTMLElement>(SELECTOR).forEach((n) => {
        // The first screen (the hero) has its own entrance.
        if (n.dataset.revealed || n.closest("[data-no-reveal]")) return;
        n.dataset.revealed = "1";
        n.classList.add("reveal");
        io.observe(n);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [root]);
};
