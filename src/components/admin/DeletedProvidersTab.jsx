import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDeletedProviders, restoreProvider } from '../../services/adminService';

function DeletedProvidersTab() {
  const { user } = useAuth();
  const canRestore = user?.adminRole === 'super_admin';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDeletedProviders();
      setListings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les prestataires supprimés.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleRestore = async (listing) => {
    try {
      await restoreProvider(listing.id);
      await fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de restaurer cette fiche.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Prestataires supprimés</h2>
      <p className="mt-1 text-sm text-gray-500">
        Suppression réversible : les fiches restent en base (leads, avis, factures conservés).
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Chargement...</p>
      ) : listings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Aucun prestataire supprimé.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{listing.title}</p>
                <p className="text-sm text-gray-500">
                  {listing.category?.name} · {listing.city}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {listing.owner?.firstName} {listing.owner?.lastName} · {listing.owner?.email}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Supprimée le {new Date(listing.deletedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {canRestore && (
                <button
                  type="button"
                  onClick={() => handleRestore(listing)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Restaurer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeletedProvidersTab;
