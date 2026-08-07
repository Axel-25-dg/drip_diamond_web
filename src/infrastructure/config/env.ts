const rawApiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api";

export const env = {
  apiUrl: rawApiUrl.replace(/\/+$/, ""),
} as const;
