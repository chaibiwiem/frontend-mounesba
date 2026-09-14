import { useEffect, useState } from 'react';
import { getAllProviders, createSubscriptionInvoice, updateSubscriptionInvoice } from '../../services/adminService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

function SubscriptionInvoiceForm({ invoice, onClose, onSuccess }) {
  const isEdit = Boolean(invoice);
  const [providers, setProviders] = useState([]);
  const [listingId, setListingId] = useState('');
  const [form, setForm] = useState({
    amount: invoice?.amount || '',
    status: invoice?.status || 'unpaid',
    issuedAt: invoice?.issuedAt || new Date().toISOString().slice(0, 10),
    dueDate: invoice?.dueDate || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) {
      getAllProviders({ limit: 100 })
        .then((data) => setProviders(data.listings))
        .catch(() => setProviders([]));
    }
  }, [isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEdit && !listingId) {
      setError('Sélectionnez un prestataire.');
      return;
    }
    if (!form.amount) {
      setError('Le montant est requis.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateSubscriptionInvoice(invoice.id, form);
      } else {
        await createSubscriptionInvoice(listingId, form);
      }
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible d\'enregistrer cette facture.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">
          {isEdit ? 'Modifier la facture' : 'Nouvelle facture'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!isEdit && (
            <div>
              <label className={labelClass}>Prestataire *</label>
              <select
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner...</option>
                {providers.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title} — {listing.owner?.firstName} {listing.owner?.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Montant TTC (DT) *</label>
            <input
              type="number"
              step="0.001"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="unpaid">Non payée</option>
              <option value="paid">Payée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date d&apos;émission</label>
              <input
                type="date"
                name="issuedAt"
                value={form.issuedAt}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date d&apos;échéance</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
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

export default SubscriptionInvoiceForm;
