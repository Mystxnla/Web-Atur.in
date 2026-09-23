import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useDemoStore = create(
  persist(
    (set) => ({
      isPanelOpen: false,
      logs: [],

      togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),
      addLog: (entry) =>
        set((s) => ({ logs: [{ ts: new Date().toISOString(), ...entry }, ...s.logs].slice(0, 50) })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'atur-in-demo',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ isPanelOpen: s.isPanelOpen }),
    }
  )
);
