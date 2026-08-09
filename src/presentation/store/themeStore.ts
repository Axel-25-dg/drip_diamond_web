import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const applyTheme = () => {
  const root = document.documentElement;
  root.classList.remove("dark");
};

export const useThemeStore = create<ThemeState>()(() => {
  applyTheme();
  return {
    theme: "light",
    toggleTheme: () => {
      applyTheme();
    },
    setTheme: () => {
      applyTheme();
    },
  };
});
