import { useEffect, useState } from 'react';
import { getPlans, updatePlan } from '../../services/adminService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-xs font-medium text-gray-700';

// Formulaire d'un plan : maxPromotions vide/decoche = illimite (NULL cote
// base, voir Plan.js) - uniquement pertinent pour Premium en pratique, mais
// laisse disponible pour tout plan.
function PlanCard({ plan, onSave }) {
  const [form, setForm] = useState({
    description: plan.description || '',
    price: plan.price,
    maxPhotos: plan.maxPhotos,
    unlimitedPromotions: plan.maxPromotions === null,
    maxPromotions: plan.maxPromotions === null ? '' : plan.maxPromotions,
    featured: plan.featured,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await onSave(plan.key, {
        description: form.description,
        price: form.price,
        maxPhotos: form.maxPhotos,
        maxPromotions: form.unlimitedPromotions ? null : form.maxPromotions,
        featured: form.featured,
      });
      setForm((prev) => ({
        ...prev,
        unlimitedPromotions: updated.maxPromotions === null,
        maxPromotions: updated.maxPromotions === null ? '' : updated.maxPromotions,
      }));
      setMessage('Plan mis à jour.');
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de sauvegarder ce plan.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">{plan.label}</h3>
        {form.featured && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
            Mis en avant
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Prix (DT / mois)</label>
            <input
              type="number"
              name="price"
              min="0"
              value={form.price}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Photos max</label>
            <input
              type="number"
              name="maxPhotos"
              min="0"
              value={form.maxPhotos}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Promotions max</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              name="maxPromotions"
              min="0"
              disabled={form.unlimitedPromotions}
              value={form.maxPromotions}
              onChange={handleChange}
              className={`${inputClass} mt-0 disabled:bg-gray-50 disabled:text-gray-400`}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
              <input
                type="checkbox"
                name="unlimitedPromotions"
                checked={form.unlimitedPromotions}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
              />
              Illimité
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          Mettre ce plan en avant (badge sur les fiches)
        </label>
      </div>

      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

// Tarification des plans Starter/Pro/Premium (CLAUDE.md/MODULES.md M9) :
// aucun paiement en ligne, ces valeurs servent uniquement de reference pour
// la facturation manuelle (hors plateforme) et l'affichage aux prestataires.
function AdminPlansSettings() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setError('Impossible de charger les plans.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key, payload) => {
    const updated = await updatePlan(key, payload);
    setPlans((prev) => prev.map((p) => (p.key === key ? updated : p)));
    return updated;
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900">Plans & Tarifs</h3>
      <p className="mt-1 text-sm text-gray-500">
        Ces montants sont déclaratifs — aucun paiement en ligne n'est traité par la plateforme, la
        facturation des prestataires reste manuelle.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} onSave={handleSave} />
        ))}
      </div>
    </div>
  );
}

export default AdminPlansSettings;
