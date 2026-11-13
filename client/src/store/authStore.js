import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global Auth Store (Zustand)
 * Persists user and role to localStorage.
 * accessToken is kept in memory only (more secure).
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      user:        null,   // { _id, name, email, role, isVerified, profileImage }
      accessToken: null,   // JWT — in memory, not persisted
      isLoading:   false,

      // ── Actions ────────────────────────────────────────────────────────────
      setUser: (user) => set({ user }),

      setAccessToken: (token) => set({ accessToken: token }),

      setAuth: (user, token) => set({ user, accessToken: token }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => set({ user: null, accessToken: null }),

      // ── Getters ────────────────────────────────────────────────────────────
      isAuthenticated: () => !!get().user && !!get().accessToken,

      isAdmin:      () => get().user?.role === "admin",
      isDonor:      () => get().user?.role === "donor",
      isHospital:   () => get().user?.role === "hospital",
      isTechnician: () => get().user?.role === "technician",
    }),
    {
      name: "blood-bank-auth",     // localStorage key
      partialize: (state) => ({
        user: state.user,
        // ⚠️ DO NOT persist accessToken — keep in memory for security
      }),
    }
  )
);

export default useAuthStore;
