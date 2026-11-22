import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BILLING_CYCLES } from '@atur-in/shared';

export const useCheckoutStore = create(
  persist(
    (set) => ({
      packageId: null,
      billingCycle: BILLING_CYCLES.MONTHLY,
      isTrial: true,
      formData: null,
      orderId: null,
      paymentId: null,
      paymentMethod: 'qris',

      setPackageId: (packageId) => set({ packageId }),
      setBillingCycle: (billingCycle) => set({ billingCycle }),
      setIsTrial: (isTrial) => set({ isTrial }),
      setFormData: (formData) => set({ formData }),
      setOrderId: (orderId) => set({ orderId }),
      setPaymentId: (paymentId) => set({ paymentId }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      clearCheckout: () =>
        set({
          packageId: null,
          billingCycle: BILLING_CYCLES.MONTHLY,
          isTrial: true,
          formData: null,
          orderId: null,
          paymentId: null,
          paymentMethod: 'qris',
        }),
    }),
    {
      name: 'atur-in-checkout',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
