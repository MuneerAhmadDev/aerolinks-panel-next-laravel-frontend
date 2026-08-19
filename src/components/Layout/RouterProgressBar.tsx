"use client";

/**
 * RouterProgressBar
 *
 * Shows an NProgress bar at the top of the page while Next.js App Router
 * is navigating.  Works by listening to window popstate events plus
 * intercepting <Link> clicks via a capture-phase click listener.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure once – thin purple bar, no spinner
NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.15 });

// Inject minimal CSS that matches the theme primary colour (#605DFF)
const CSS = `
#nprogress { pointer-events: none; }
#nprogress .bar {
  background: #605DFF;
  position: fixed;
  z-index: 99999;
  top: 0; left: 0;
  width: 100%; height: 3px;
}
#nprogress .peg {
  display: block;
  position: absolute;
  right: 0px; width: 100px; height: 100%;
  box-shadow: 0 0 10px #605DFF, 0 0 5px #605DFF;
  opacity: 1;
  transform: rotate(3deg) translate(0px, -4px);
}
`;

let styleInjected = false;

function injectStyle() {
  if (styleInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
  styleInjected = true;
}

export default function RouterProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Complete bar on every pathname/searchParams change (i.e. navigation done)
  useEffect(() => {
    injectStyle();
    NProgress.done();
  }, [pathname, searchParams]);

  // Start bar on link clicks (capture phase so it fires before Next.js)
  useEffect(() => {
    injectStyle();

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore hash links, external links, and non-left-click
      if (
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      )
        return;

      NProgress.start();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
