import { useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

function PlanModal({ listing, subscription, onConfirm, onCancel }) {
  const [form, setForm] = useState({
    plan: subscription?.plan || 'starter',
    billingCycle: subscription?.billingCycle || 'monthly',
    status: subscription?.status || 'active',
    startDate: subscription?.startDate || '',
    endDate: subscription?.endDate || '',
    price: subscription?.price ?? '',
    paymentReference: subscription?.paymentReference || '',
    notes: subscription?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onConfirm({ ...form, endDate: form.endDate || null, price: form.price === '' ? undefined : form.price });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de mettre à jour cet abonnement.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Modifier l&apos;abonnement</h3>
        <p className="mt-1 text-sm text-gray-500">{listing.title}</p>

        <form onSubmit={handleConfirm} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Plan</label>
              <select name="plan" value={form.plan} onChange={handleChange} className={inputClass}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Facturation</label>
              <select
                name="billingCycle"
                value={form.billingCycle}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="active">Active</option>
              <option value="expired">Expirée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Début</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Expiration</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Montant payé (DT)</label>
            <input
              type="number"
              step="0.001"
              name="price"
              value={form.price}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Référence paiement</label>
            <input
              name="paymentReference"
              value={form.paymentReference}
              onChange={handleChange}
              placeholder="ex: virement RIB, N° reçu..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Notes internes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlanModal;
