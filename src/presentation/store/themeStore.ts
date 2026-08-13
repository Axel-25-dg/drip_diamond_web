import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const getSavedTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  }
  return "dark"; // Default to dark for liquidaciones dashboard or light if preferred
};

const applyThemeToDom = (t: Theme) => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", t);
  }
};

const initialTheme = getSavedTheme();
applyThemeToDom(initialTheme);

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: initialTheme,
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === "light" ? "dark" : "light";
      applyThemeToDom(nextTheme);
      return { theme: nextTheme };
    });
  },
  setTheme: (t: Theme) => {
    applyThemeToDom(t);
    set({ theme: t });
  },
}));

