import { useEffect, useState } from 'react';
import { getMySubscription } from '../../services/subscriptionService';
import { IconCheckCircle, IconDownload, IconFileText } from '../icons';

const PLAN_COLORS = {
  starter: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS = { active: 'Actif', expired: 'Expiré', cancelled: 'Annulé' };
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-700',
};

const BILLING_LABELS = { monthly: 'Mensuel', yearly: 'Annuel' };

const INVOICE_STATUS_LABELS = { unpaid: 'Non payée', paid: 'Payée', cancelled: 'Annulée' };
const INVOICE_STATUS_COLORS = {
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function formatDateLong(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getFeatureList(limits) {
  const features = [
    `Jusqu'à ${limits.maxPhotos} photos`,
    limits.maxPromotions === null || limits.maxPromotions > 100
      ? 'Promotions illimitées'
      : `${limits.maxPromotions} promotion(s) active(s) max`,
  ];
  if (limits.featured) features.push('Mise en avant dans les résultats de recherche');
  return features;
}

function SubscriptionTab() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMySubscription()
      .then(setSubscription)
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger votre abonnement.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (!subscription) return <p className="text-sm text-red-600">{error}</p>;

  const limits = subscription.plans[subscription.plan];
  const features = getFeatureList(limits);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Facturation</h2>
      <p className="mt-1 text-sm text-gray-500">Votre plan actuel</p>

      <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${PLAN_COLORS[subscription.plan]}`}>
              {limits.label}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[subscription.status]}`}
            >
              {STATUS_LABELS[subscription.status]}
            </span>
          </div>
          <span className="text-sm text-gray-400">{BILLING_LABELS[subscription.billingCycle]}</span>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          {subscription.endDate
            ? `Expire le ${formatDateLong(subscription.endDate)}`
            : 'Aucune échéance (plan gratuit)'}
        </p>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">
          Fonctionnalités incluses
        </p>
        <ul className="mt-2 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
              <IconCheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>

        <p className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
          Pour changer de plan, contactez l&apos;administrateur.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <IconFileText className="h-4 w-4 text-gray-400" />
            Historique des factures
          </div>
          <span className="text-xs text-gray-400">{subscription.invoices.length} facture(s)</span>
        </div>

        {subscription.invoices.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-gray-500">Aucune facture pour le moment.</p>
        ) : (
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">N° Facture</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Période</th>
                  <th className="px-5 py-3">Montant</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscription.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{invoice.number}</td>
                    <td className="px-5 py-3 text-gray-600">{invoice.issuedAt}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {invoice.issuedAt} — {invoice.dueDate || '—'}
                    </td>
                    <td className="px-5 py-3 font-medium text-rose-600">
                      {Number(invoice.amount).toFixed(3)} DT
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          INVOICE_STATUS_COLORS[invoice.status]
                        }`}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <IconDownload className="h-3.5 w-3.5" />
                          Télécharger PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Aucun paiement en ligne : le règlement se fait hors plateforme (cash ou virement RIB).
        L&apos;activation et la facturation sont gérées manuellement par notre équipe.
      </p>
    </div>
  );
}

export default SubscriptionTab;
