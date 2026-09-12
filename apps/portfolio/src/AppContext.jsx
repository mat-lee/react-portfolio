import { createContext, useContext, useState } from "react";
import { audio } from "./audio";

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(
    () =>
      localStorage.getItem("theme") ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [isTransitioningTheme, setIsTransitioningTheme] = useState(false);

  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  const setTheme = (newTheme) => {
    if (newTheme === theme) return;
    setIsTransitioningTheme(true);
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const setSoundEnabled = (enabled) => {
    setSoundEnabledState(enabled);
    audio.toggle(enabled);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        soundEnabled,
        setSoundEnabled,
        isTransitioningTheme,
        setIsTransitioningTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
