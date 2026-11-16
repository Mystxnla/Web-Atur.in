import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: ({ user, accessToken }) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'atur-in-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
);
