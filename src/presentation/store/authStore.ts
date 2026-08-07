import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/domain/entities/User";
import { tokenStorage } from "@/infrastructure/storage/tokenStorage";
import { useCases } from "@/infrastructure/factories/useCases.factory";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  register: (payload: { nombre: string; apellido: string; correo: string; telefono: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  hydrateProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (correo, password) => {
        set({ isLoading: true });
        try {
          const session = await useCases.login.execute({ correo, password });
          tokenStorage.set(session.tokens.access, session.tokens.refresh);
          set({ user: session.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          await useCases.register.execute(payload);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const refresh = tokenStorage.getRefresh();
        try {
          if (refresh) await useCases.logout.execute(refresh);
        } catch {
          // ignoramos: igual limpiamos la sesión local
        }
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false });
      },

      hydrateProfile: async () => {
        if (!tokenStorage.getAccess()) return;
        try {
          const user = await useCases.getProfile.execute();
          set({ user, isAuthenticated: true });
        } catch {
          tokenStorage.clear();
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    { name: "drip_diamond_auth", partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) }
  )
);

window.addEventListener("auth:session-expired", () => {
  useAuthStore.getState().setUser(null);
});
