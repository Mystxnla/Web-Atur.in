import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCheckoutStore = create(
  persist(
    (set) => ({
      packageId: null,
      formData: null,
      orderId: null,
      paymentId: null,
      paymentMethod: 'qris',

      setPackageId: (packageId) => set({ packageId }),
      setFormData: (formData) => set({ formData }),
      setOrderId: (orderId) => set({ orderId }),
      setPaymentId: (paymentId) => set({ paymentId }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      clearCheckout: () =>
        set({ packageId: null, formData: null, orderId: null, paymentId: null, paymentMethod: 'qris' }),
    }),
    {
      name: 'atur-in-checkout',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
