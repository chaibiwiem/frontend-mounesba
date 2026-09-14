import { useEffect, useState } from 'react';
import { getCategories, getCities } from '../../services/listingService';
import { updateProvider } from '../../services/adminService';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'categoryId',
  'city',
  'address',
  'phone',
  'priceFrom',
  'priceTo',
  'avgSpent',
  'capacity',
  'website',
  'facebookUrl',
  'instagramUrl',
  'yearsExperience',
  'languages',
];

function EditProviderForm({ listing, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(() => {
    const initial = {};
    EDITABLE_FIELDS.forEach((field) => {
      initial[field] = listing[field] ?? '';
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getCities()
      .then((data) => setCities(data.map((c) => c.name)))
      .catch(() => setCities([]));
  }, []);

  const flatCategories = categories.flatMap((cat) => [cat, ...cat.children]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await updateProvider(listing.id, form);
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Impossible de modifier cette fiche.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Modifier la fiche</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Nom de l&apos;entreprise</label>
            <input name="title" value={form.title} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Catégorie</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} className={inputClass}>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Ville / région</label>
              <select name="city" value={form.city} onChange={handleChange} className={inputClass}>
                <option value="">Sélectionner...</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Adresse</label>
              <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Prix de départ (DT)</label>
              <input
                type="number"
                name="priceFrom"
                value={form.priceFrom}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prix maximum (DT)</label>
              <input
                type="number"
                name="priceTo"
                value={form.priceTo}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Capacité (invités)</label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Site web</label>
              <input name="website" value={form.website} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Langues parlées</label>
              <input name="languages" value={form.languages} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProviderForm;
