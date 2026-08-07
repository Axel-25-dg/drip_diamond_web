import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/presentation/router";
import { useAuthStore } from "@/presentation/store/authStore";
import { useThemeStore } from "@/presentation/store/themeStore";

function App() {
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile);
  const theme = useThemeStore((s) => s.theme);

  // Apply theme class to <html> on mount & whenever theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    hydrateProfile();
  }, [hydrateProfile]);

  return <RouterProvider router={router} />;
}

export default App;
