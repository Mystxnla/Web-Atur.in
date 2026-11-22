import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import Stepper from '../../components/ui/Stepper.jsx';
import OrderDetailForm from '../../features/checkout/OrderDetailForm.jsx';
import { PACKAGES, BILLING_CYCLES } from '@atur-in/shared';

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { packageId, isTrial, setPackageId, setBillingCycle, setIsTrial } = useCheckoutStore();
  const activePkg = PACKAGES.find((p) => p.id === packageId);
  const effectiveTrial = Boolean(activePkg?.hasTrial && isTrial);
  const steps = effectiveTrial
    ? ['Paket', 'Info Tim', 'Workspace Aktif']
    : ['Paket', 'Info Tim', 'Bayar', 'Workspace Aktif'];

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
      <Stepper currentStep={2} steps={steps} />
      <OrderDetailForm />
    </div>
  );
}
