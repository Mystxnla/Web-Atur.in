import { Outlet } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import DemoPanel from '../../features/demo/DemoPanel.jsx';
import PrototypeBadge from '../../components/ui/PrototypeBadge.jsx';
import { SITE } from '../../config/site.js';

export default function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {SITE.showPrototypeBadge && <PrototypeBadge />}
      {SITE.enableDemoPanel && <DemoPanel />}
    </div>
  );
}
