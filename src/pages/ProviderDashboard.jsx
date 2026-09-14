import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMyListing, getCategories } from '../services/listingService';
import { getListingLeads } from '../services/leadService';
import { getListingEventLeads } from '../services/providerEventService';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import {
  IconInbox,
  IconUsers,
  IconStar,
  IconUser,
  IconImage,
  IconTag,
  IconCalendar,
  IconPercent,
  IconFileText,
  IconReceipt,
  IconClipboardCheck,
  IconCrown,
  IconCar,
  IconChair,
  IconConfetti,
  IconMail,
} from '../components/icons';
import LeadsTab from '../components/provider/LeadsTab';
import ProfileTab from '../components/provider/ProfileTab';
import EmailSettingsTab from '../components/provider/EmailSettingsTab';
import GalleryTab from '../components/provider/GalleryTab';
import EventsTab from '../components/provider/EventsTab';
import PackagesTab from '../components/provider/PackagesTab';
import EquipmentsTab from '../components/provider/EquipmentsTab';
import CalendarTab from '../components/provider/CalendarTab';
import BookingsTab from '../components/provider/BookingsTab';
import FleetTab from '../components/provider/FleetTab';
import PromotionsTab from '../components/provider/PromotionsTab';
import ClientsTab from '../components/provider/ClientsTab';
import ContractsTab from '../components/provider/ContractsTab';
import InvoicesTab from '../components/provider/InvoicesTab';
import ReviewsTab from '../components/provider/ReviewsTab';
import SubscriptionTab from '../components/provider/SubscriptionTab';

const BASE_TABS = [
  { id: 'leads', label: 'Demandes', icon: IconInbox },
  { id: 'bookings', label: 'Réservations', icon: IconClipboardCheck },
  { id: 'clients', label: 'Clients (CRM)', icon: IconUsers },
  { id: 'gallery', label: 'Galerie', icon: IconImage },
  { id: 'promotions', label: 'Promotions', icon: IconPercent },
  { id: 'packages', label: 'Packs', icon: IconTag },
  { id: 'calendar', label: 'Calendrier', icon: IconCalendar },
  // Reservee aux prestataires de categorie Transport (voir isTransportProvider).
  { id: 'fleet', label: 'Ma flotte', icon: IconCar },
  { id: 'amenities', label: 'Équipements', icon: IconChair },
  { id: 'events', label: 'Mes événements', icon: IconConfetti },
  { id: 'reviews', label: 'Avis', icon: IconStar },
  { id: 'profile', label: 'Informations entreprise', icon: IconUser },
  { id: 'email-settings', label: 'Email SMTP', icon: IconMail },
  { id: 'contracts', label: 'Contrats', icon: IconFileText },
  { id: 'invoices', label: 'Factures', icon: IconReceipt },
  { id: 'subscription', label: 'Abonnement', icon: IconCrown },
];

function ProviderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [logoUrl, setLogoUrl] = useState(null);
  const [providerName, setProviderName] = useState('');
  const [listingAddress, setListingAddress] = useState('');
  // Flotte de vehicules : uniquement pour les prestataires de la categorie
  // Transport (sous-categories "Location de voitures"/"Location de bus").
  const [isTransportProvider, setIsTransportProvider] = useState(false);
  // Compte les demandes non traitees (devis ou location - meme modele Lead
  // pour les deux, voir LeadsTab) pour le badge de l'onglet Demandes.
  const [pendingLeadsCount, setPendingLeadsCount] = useState(0);
  // Compte les demandes d'interet non traitees sur un evenement prestataire
  // (bouton "Je suis interesse(e)", liste dediee - voir EventsTab) pour le
  // badge de l'onglet Mes evenements.
  const [pendingEventLeadsCount, setPendingEventLeadsCount] = useState(0);

  const refreshPendingLeadsCount = async (listingId) => {
    try {
      const data = await getListingLeads(listingId);
      const pending = (data.leads || []).filter((lead) => ['new', 'late'].includes(lead.status)).length;
      setPendingLeadsCount(pending);
    } catch {
      setPendingLeadsCount(0);
    }
  };

  const refreshPendingEventLeadsCount = async (listingId) => {
    try {
      const data = await getListingEventLeads(listingId);
      const pending = (data.leads || []).filter((lead) => ['new', 'late'].includes(lead.status)).length;
      setPendingEventLeadsCount(pending);
    } catch {
      setPendingEventLeadsCount(0);
    }
  };

  useEffect(() => {
    if (!user?.listingId) return;
    refreshPendingLeadsCount(user.listingId);
    refreshPendingEventLeadsCount(user.listingId);
    getMyListing()
      .then(async (listing) => {
        setLogoUrl(listing.logoUrl || null);
        setProviderName(listing.title || '');
        setListingAddress(listing.address || '');

        try {
          const categories = await getCategories();
          const transportCategory = categories.find((c) => c.slug === 'transport');
          const isTransport = Boolean(
            transportCategory &&
              (transportCategory.id === listing.categoryId ||
                transportCategory.children?.some((child) => child.id === listing.categoryId))
          );
          setIsTransportProvider(isTransport);
        } catch {
          setIsTransportProvider(false);
        }
      })
      .catch(() => {});
  }, [user?.listingId]);

  const tabs = BASE_TABS.filter((tab) => tab.id !== 'fleet' || isTransportProvider).map((tab) => {
    if (tab.id === 'leads') return { ...tab, badge: pendingLeadsCount };
    if (tab.id === 'events') return { ...tab, badge: pendingEventLeadsCount };
    return tab;
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'leads' && user?.listingId) {
      refreshPendingLeadsCount(user.listingId);
    }
    if (tabId === 'events' && user?.listingId) {
      refreshPendingEventLeadsCount(user.listingId);
    }
  };

  if (!user?.listingId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-500">
        Aucune fiche prestataire associee a votre compte.
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Espace prestataire"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      logoUrl={logoUrl}
      providerName={providerName}
    >
      {activeTab === 'leads' && (
        <LeadsTab
          listingId={user.listingId}
          onLeadsChange={() => refreshPendingLeadsCount(user.listingId)}
        />
      )}
      {activeTab === 'bookings' && (
        <BookingsTab listingId={user.listingId} isTransportProvider={isTransportProvider} />
      )}
      {activeTab === 'clients' && <ClientsTab listingId={user.listingId} />}
      {activeTab === 'reviews' && <ReviewsTab listingId={user.listingId} />}
      {activeTab === 'profile' && (
        <ProfileTab listingId={user.listingId} logoUrl={logoUrl} onLogoChange={setLogoUrl} />
      )}
      {activeTab === 'email-settings' && <EmailSettingsTab />}
      {activeTab === 'gallery' && <GalleryTab listingId={user.listingId} />}
      {activeTab === 'events' && (
        <EventsTab
          listingId={user.listingId}
          listingAddress={listingAddress}
          onLeadsChange={() => refreshPendingEventLeadsCount(user.listingId)}
        />
      )}
      {activeTab === 'packages' && <PackagesTab listingId={user.listingId} />}
      {activeTab === 'amenities' && <EquipmentsTab listingId={user.listingId} />}
      {activeTab === 'calendar' && <CalendarTab listingId={user.listingId} />}
      {activeTab === 'fleet' && isTransportProvider && <FleetTab listingId={user.listingId} />}
      {activeTab === 'promotions' && <PromotionsTab listingId={user.listingId} />}
      {activeTab === 'contracts' && <ContractsTab listingId={user.listingId} />}
      {activeTab === 'invoices' && <InvoicesTab listingId={user.listingId} />}
      {activeTab === 'subscription' && <SubscriptionTab />}
    </DashboardLayout>
  );
}

export default ProviderDashboard;
