import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import Stepper from '../../components/ui/Stepper.jsx';
import OrderDetailForm from '../../features/checkout/OrderDetailForm.jsx';
import { PACKAGES, BILLING_CYCLES } from '@atur-in/shared';

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { packageId, setPackageId, setBillingCycle, setIsTrial } = useCheckoutStore();

  useEffect(() => {
    const paketParam = params.get('paket');
    const cycleParam = params.get('cycle');
    const trialParam = params.get('trial');

    if (cycleParam && Object.values(BILLING_CYCLES).includes(cycleParam)) {
      setBillingCycle(cycleParam);
    }

    if (paketParam) {
      const valid = PACKAGES.find((p) => p.id === paketParam);
      if (valid) {
        setPackageId(paketParam);
        if (!valid.hasTrial) {
          setIsTrial(false);
        } else if (trialParam !== null) {
          setIsTrial(trialParam === '1' || trialParam === 'true');
        } else {
          setIsTrial(true);
        }
        return;
      }
    } else if (packageId) {
      const currentPkg = PACKAGES.find((p) => p.id === packageId);
      if (currentPkg && !currentPkg.hasTrial) {
        setIsTrial(false);
      }
    }

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
