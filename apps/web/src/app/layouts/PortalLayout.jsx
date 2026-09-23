import { Outlet } from 'react-router-dom';
import PortalHeader from '../../components/layout/PortalHeader.jsx';
import DemoPanel from '../../features/demo/DemoPanel.jsx';
import PrototypeBadge from '../../components/ui/PrototypeBadge.jsx';
import { SITE } from '../../config/site.js';

export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PortalHeader />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        <Outlet />
      </main>
      {SITE.showPrototypeBadge && <PrototypeBadge />}
      {SITE.enableDemoPanel && <DemoPanel />}
    </div>
  );
}
