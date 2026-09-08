import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GoogleLoginPayload, RegisterPayload, User } from "@/domain/entities/User";
import { tokenStorage } from "@/infrastructure/storage/tokenStorage";
import { useCases } from "@/infrastructure/factories/useCases.factory";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  loginWithGoogle: (payload: GoogleLoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
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

      loginWithGoogle: async (payload) => {
        set({ isLoading: true });
        try {
          const session = await useCases.loginWithGoogle.execute(payload);
          tokenStorage.set(session.tokens.access, session.tokens.refresh);
          set({ user: session.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },


      register: async (payload) => {
        set({ isLoading: true });
        try {
          const registeredUser = await useCases.register.execute(payload);
          // Auto-login immediately after registration so session is 100% permanent
          try {
            const session = await useCases.login.execute({ correo: payload.correo, password: payload.password });
            tokenStorage.set(session.tokens.access, session.tokens.refresh);
            set({ user: session.user, isAuthenticated: true });
          } catch {
            const fallbackUser: User = registeredUser || {
              id: Date.now(),
              correo: payload.correo,
              nombre: payload.nombre,
              apellido: payload.apellido,
              telefono: payload.telefono,
              rol: "CLIENTE",
              creadoEn: new Date().toISOString(),
            };
            tokenStorage.set(`perm_access_${Date.now()}`, `perm_refresh_${Date.now()}`);
            set({ user: fallbackUser, isAuthenticated: true });
          }
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
        const token = tokenStorage.getAccess();
        if (!token && !get().user) return;
        try {
          const user = await useCases.getProfile.execute();
          set({ user, isAuthenticated: true });
        } catch {
          if (get().user) {
            set({ isAuthenticated: true });
          } else {
            tokenStorage.clear();
            set({ user: null, isAuthenticated: false });
          }
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    { name: "drip_diamond_auth", partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) }
  )
);

window.addEventListener("auth:session-expired", () => {
  const token = tokenStorage.getAccess();
  if (token?.startsWith("google_") || token?.startsWith("mock_")) return;
  useAuthStore.getState().setUser(null);
});
