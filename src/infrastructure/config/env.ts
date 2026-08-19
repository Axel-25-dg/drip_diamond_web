const rawApiUrl = (import.meta.env.VITE_API_URL as string) || "https://dripdiamond.store/api";

export const env = {
  apiUrl: rawApiUrl.replace(/\/+$/, ""),
} as const;
