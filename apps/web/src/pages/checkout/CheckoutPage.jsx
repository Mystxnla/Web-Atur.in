import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import Stepper from '../../components/ui/Stepper.jsx';
import OrderDetailForm from '../../features/checkout/OrderDetailForm.jsx';
import { PACKAGES } from '@atur-in/shared';

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { packageId, setPackageId } = useCheckoutStore();

  useEffect(() => {
    const paketParam = params.get('paket');
    if (paketParam) {
      const valid = PACKAGES.find((p) => p.id === paketParam);
      if (valid) {
        setPackageId(paketParam);
        return;
      }
    }
    // If no valid param and no stored packageId, redirect to pricing
    if (!packageId) {
      navigate('/#harga', { replace: true });
    }
  }, []);

  return (
    <div className="space-y-6">
      <Stepper currentStep={2} />
      <OrderDetailForm />
    </div>
  );
}
