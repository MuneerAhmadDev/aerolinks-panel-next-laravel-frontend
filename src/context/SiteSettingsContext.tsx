"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SiteSettings {
  logoUrl: string | null;
  siteTitle: string | null;
  tagline: string | null;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettings>({
  logoUrl: null,
  siteTitle: null,
  tagline: null,
  loading: true,
});

// Module-level cache so the API is only called once per browser session,
// regardless of how many times the provider mounts.
let _cached: { logoUrl: string | null; siteTitle: string | null; tagline: string | null } | null = null;

export const SiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() =>
    _cached
      ? { ..._cached, loading: false }
      : { logoUrl: null, siteTitle: null, tagline: null, loading: true }
  );

  useEffect(() => {
    if (_cached) return; // already fetched this session

    const base = (
      process.env.NEXT_PUBLIC_API_URL ??
      (process.env.NODE_ENV === "production"
        ? "https://surgimedsupplies.com/aero-api"
        : "http://localhost:8000")
    ).replace(/\/+$/, "");
    fetch(`${base}/api/public/settings`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        _cached = {
          logoUrl:   data.logo_url   ?? null,
          siteTitle: data.site_title ?? null,
          tagline:   data.tagline    ?? null,
        };
        setSettings({ ..._cached, loading: false });
      })
      .catch(() => {
        // Silently fall back — components will use their static fallback logos
        setSettings({ logoUrl: null, siteTitle: null, tagline: null, loading: false });
      });
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
