import { useEffect, useState } from 'react';
import { getMyBookings } from '../services/bookingService';
import { getMyFavorites, removeFavorite } from '../services/favoriteService';
import ReviewForm from '../components/ReviewForm';
import ListingCard from '../components/ListingCard';
import { IconCalendar, IconStar, IconHeart } from '../components/icons';

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const TABS = [
  { key: 'bookings', label: 'Mes réservations' },
  { key: 'favorites', label: 'Mes favoris' },
];

function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingBooking, setReviewingBooking] = useState(null);

  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const data = await getMyFavorites();
      setFavorites(data);
    } catch (err) {
      setFavoritesError(err.response?.data?.message || 'Impossible de charger vos favoris.');
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchFavorites();
  }, []);

  const handleUnfavorite = async (listingId) => {
    setFavorites((prev) => prev.filter((listing) => listing.id !== listingId));
    try {
      await removeFavorite(listingId);
    } catch (err) {
      fetchFavorites();
    }
  };

  return (
    <div className="min-h-[calc(100vh-57px)] bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="w-full !px-[50px] py-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mon espace client</h1>
          <p className="mt-1 text-sm text-gray-500">
            Suivez vos événements, laissez un avis et retrouvez vos prestataires favoris.
          </p>

          <div className="mt-4 flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <div className="w-full !px-[50px] py-6">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <IconCalendar className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucune réservation pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <IconCalendar className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{booking.listing?.title}</p>
                        <p className="text-sm text-gray-500">
                          {booking.listing?.city} {booking.eventDate && `· ${booking.eventDate}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  {booking.status === 'completed' && (
                    <div className="mt-3 pl-12">
                      {booking.review ? (
                        <div className="rounded-lg bg-gray-50 p-3 text-sm">
                          <span className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: booking.review.rating }).map((_, i) => (
                              <IconStar key={i} className="h-3.5 w-3.5 fill-current" />
                            ))}
                          </span>
                          {booking.review.title && (
                            <p className="mt-1 font-semibold text-gray-800">{booking.review.title}</p>
                          )}
                          {booking.review.comment && (
                            <p className="mt-1 text-gray-600">{booking.review.comment}</p>
                          )}
                          <span className="mt-1 inline-block text-xs font-medium text-green-600">
                            Avis publié
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReviewingBooking(booking)}
                          className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                        >
                          Laisser un avis
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full !px-[50px] py-6">
          {favoritesError && <p className="text-sm text-red-600">{favoritesError}</p>}

          {favoritesLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : favorites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <IconHeart className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucun prestataire favori pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={{ ...listing, isFavorited: true }}
                  onUnfavorite={() => handleUnfavorite(listing.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {reviewingBooking && (
        <ReviewForm
          bookingId={reviewingBooking.id}
          listing={reviewingBooking.listing}
          onClose={() => setReviewingBooking(null)}
          onSuccess={() => {
            setReviewingBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}

export default ClientDashboard;
