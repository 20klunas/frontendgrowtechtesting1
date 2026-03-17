"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { publicFetch } from "../lib/publicFetch";
import { isMaintenanceError } from "../lib/maintenanceHandler";

const WebsiteSettingsContext = createContext(null);

let cachedSettings = null;

function normalizeSettings(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export function WebsiteSettingsProvider({ children }) {
  const [loading, setLoading] = useState(!cachedSettings);
  const [settings, setSettings] = useState(cachedSettings || {});
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    if (cachedSettings) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await publicFetch("/api/v1/content/settings?group=website");

        const mapped = normalizeSettings(res?.data || []);

        if (!active) return;

        cachedSettings = mapped;

        setSettings(mapped);
      } catch (err) {
        if (!active) return;

        if (!isMaintenanceError(err)) {
          console.error("Failed fetch website settings:", err);
        }

        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      active = false;
    };
  }, []);

  const brand = settings?.brand || {};
  const footer = settings?.footer || {};
  const seo = settings?.seo || {};

  const value = useMemo(() => {
    return {
      loading,
      settings,
      brand,
      footer,
      seo,
      error,
    };
  }, [loading, settings, error]); 

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  const context = useContext(WebsiteSettingsContext);

  if (!context) {
    throw new Error(
      "useWebsiteSettings must be used within WebsiteSettingsProvider"
    );
  }

  return context;
}