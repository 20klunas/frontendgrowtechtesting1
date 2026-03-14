"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { publicFetch } from "../lib/publicFetch";
import { isMaintenanceError } from "../lib/maintenanceHandler";

const WebsiteSettingsContext = createContext(null);

function normalizeSettings(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export function WebsiteSettingsProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [brand, setBrand] = useState({});
  const [footer, setFooter] = useState({});
  const [seo, setSeo] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await publicFetch("/api/v1/content/settings?group=website");
        const mapped = normalizeSettings(res?.data || []);

        if (!active) return;

        setSettings(mapped);
        setBrand(mapped.brand || {});
        setFooter(mapped.footer || {});
        setSeo(mapped.seo || {});
      } catch (err) {
        if (!active) return;

        if (!isMaintenanceError(err)) {
          console.error("Failed fetch website settings:", err);
        }

        setError(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => {
    return {
      loading,
      settings,
      brand,
      footer,
      seo,
      error,
    };
  }, [loading, settings, brand, footer, seo, error]);

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  const context = useContext(WebsiteSettingsContext);

  if (!context) {
    throw new Error("useWebsiteSettings must be used within WebsiteSettingsProvider");
  }

  return context;
}