"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SettingsState {
  darkTheme: boolean;
  liquidTransitions: boolean;
  realTimeSync: boolean;
}

interface SettingsContextType extends SettingsState {
  setDarkTheme: (value: boolean) => void;
  setLiquidTransitions: (value: boolean) => void;
  setRealTimeSync: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>({
    darkTheme: true,
    liquidTransitions: true,
    realTimeSync: false,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("app-settings", JSON.stringify(settings));

      // Apply dark mode class to HTML
      if (settings.darkTheme) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Apply liquid transitions class if needed
      if (settings.liquidTransitions) {
        document.documentElement.classList.add("liquid-transitions");
      } else {
        document.documentElement.classList.remove("liquid-transitions");
      }
    }
  }, [settings, mounted]);

  const setDarkTheme = (darkTheme: boolean) =>
    setSettings((s) => ({ ...s, darkTheme }));
  const setLiquidTransitions = (liquidTransitions: boolean) =>
    setSettings((s) => ({ ...s, liquidTransitions }));
  const setRealTimeSync = (realTimeSync: boolean) =>
    setSettings((s) => ({ ...s, realTimeSync }));

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setDarkTheme,
        setLiquidTransitions,
        setRealTimeSync,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
