import { useState } from 'react';
import SubscriptionsOverviewTab from './SubscriptionsOverviewTab';
import SubscriptionInvoicesTab from './SubscriptionInvoicesTab';
import { IconReceipt, IconFileText } from '../icons';

const SUB_TABS = [
  { id: 'subscriptions', label: 'Abonnements', icon: IconReceipt },
  { id: 'invoices', label: 'Factures', icon: IconFileText },
];

function BillingTab() {
  const [activeSubTab, setActiveSubTab] = useState('subscriptions');

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Facturation</h2>
      <p className="mt-1 text-sm text-gray-500">Gestion des abonnements et factures</p>

      <div className="mt-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {activeSubTab === 'subscriptions' && <SubscriptionsOverviewTab />}
        {activeSubTab === 'invoices' && <SubscriptionInvoicesTab />}
      </div>
    </div>
  );
}

export default BillingTab;
