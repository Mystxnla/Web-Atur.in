import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSessionStore = create(
  persist(
    (set) => ({
      sessionToken: null,
      customer: null,
      orders: [],
      otpRequest: null, // { requestId, expiresAt, maskedWa, noWhatsapp }

      setOtpRequest: (otpRequest) => set({ otpRequest }),
      setSession: ({ sessionToken, customer, orders }) =>
        set({ sessionToken, customer, orders }),
      clearSession: () =>
        set({ sessionToken: null, customer: null, orders: [], otpRequest: null }),
    }),
    {
      name: 'atur-in-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
