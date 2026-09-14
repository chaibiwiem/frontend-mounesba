import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createLead } from '../services/leadService';
import { getVehicleReservedPeriods } from '../services/vehicleService';
import { hasPositivePrice } from '../utils/rentalPricing';
import DecorationPickerModal from './DecorationPickerModal';
import { IconFlower } from './icons';

const GUEST_RANGES = ['1-50', '50-100', '100-150', '150-200', '200-300', '300+'];
const VEHICLE_TYPE_LABELS = { voiture: 'Voiture', bus: 'Bus', minibus: 'Minibus' };

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Vrai si [depA, retA[ chevauche une des periodes deja reservees [depB, retB[.
const overlapsReservedPeriod = (departureDatetime, returnDatetime, reservedPeriods) => {
  if (!departureDatetime || !returnDatetime) return false;
  const departure = new Date(departureDatetime).getTime();
  const ret = new Date(returnDatetime).getTime();
  return reservedPeriods.some((period) => {
    const periodStart = new Date(period.departureDatetime).getTime();
    const periodEnd = new Date(period.returnDatetime).getTime();
    return departure < periodEnd && ret > periodStart;
  });
};

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  eventDate: '',
  dateFlexible: false,
  guests: '',
  message: '',
  // Champs specifiques a une demande de location de vehicule (prestataires
  // de categorie Transport uniquement, cf. variant==='transport') : ignores
  // par le backend pour toute autre categorie meme s'ils sont envoyes.
  departureDatetime: '',
  returnDatetime: '',
  passengers: '',
  vehicleId: '',
  withDriver: '',
  decorationId: '',
  pickupLocation: '',
  // { [vehicleOptionId]: quantity } - options supplementaires choisies
  // (2eme conducteur, GPS, siege bebe...), propres au vehicule selectionne.
  optionQuantities: {},
  // Champs specifiques a une commande produit (prestataires "Parfums &
  // Soins" uniquement, cf. variant==='product') : ignores par le backend
  // pour toute autre categorie meme s'ils sont envoyes.
  packageId: '',
  quantity: '',
  deliveryDate: '',
  deliveryMode: '',
  deliveryAddress: '',
  customization: '',
};

function ContactForm({
  listingId,
  initialMessage,
  // 'transport' (location de vehicule) | 'product' (commande produit,
  // "Parfums & Soins") | 'standard' (demande d'evenement classique, defaut).
  // Un seul jeu de champs conditionnels ci-dessous plutot qu'un composant
  // distinct par categorie - voir ListingDetail pour le calcul du variant.
  variant = 'standard',
  vehicles,
  products,
  initialVehicleId,
  initialDecorationId,
  onClose,
  // Affichage integre a la page (fiche prestataire, comme "Demander un
  // devis" dans la reference) plutot qu'en popup - pas de fond noir/croix de
  // fermeture, le formulaire reste toujours visible dans la sidebar.
  inline = false,
}) {
  const isTransport = variant === 'transport';
  const isProduct = variant === 'product';
  // Client deja connecte : pre-remplit ses coordonnees (comme la reference)
  // pour eviter de les ressaisir - il reste libre de les modifier.
  const { user } = useAuth();

  const [form, setForm] = useState({
    ...initialState,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: initialMessage || '',
    vehicleId: initialVehicleId ? String(initialVehicleId) : '',
    decorationId: initialDecorationId ? String(initialDecorationId) : '',
  });

  // En mode inline, le composant reste monte en permanence (pas de
  // remontage a chaque ouverture comme en popup) : il faut donc resynchroniser
  // ces champs quand le parent change sa selection (ex: choix d'un autre
  // vehicule, ou d'un autre package pre-remplissant le message).
  useEffect(() => {
    if (!inline) return;
    setForm((prev) => ({ ...prev, message: initialMessage || '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline, initialMessage]);

  useEffect(() => {
    if (!inline) return;
    setForm((prev) => ({
      ...prev,
      vehicleId: initialVehicleId ? String(initialVehicleId) : '',
      decorationId: initialDecorationId ? String(initialDecorationId) : '',
      optionQuantities: {},
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline, initialVehicleId, initialDecorationId]);
  const [showDecorationPicker, setShowDecorationPicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reservedPeriods, setReservedPeriods] = useState([]);

  const selectedVehicle = vehicles?.find((v) => String(v.id) === form.vehicleId);
  const availableDecorations = selectedVehicle?.hasDecoration ? selectedVehicle.decorations || [] : [];
  const selectedDecoration = availableDecorations.find((d) => String(d.id) === form.decorationId);
  const availableOptions = selectedVehicle?.options || [];

  // Dates deja reservees pour le vehicule choisi : affichees au client et
  // utilisees pour bloquer une demande qui chevaucherait une location active
  // (le backend re-verifie de toute facon a la soumission).
  useEffect(() => {
    if (!isTransport || !form.vehicleId) {
      setReservedPeriods([]);
      return;
    }
    let cancelled = false;
    getVehicleReservedPeriods(form.vehicleId)
      .then((periods) => {
        if (!cancelled) setReservedPeriods(periods);
      })
      .catch(() => {
        if (!cancelled) setReservedPeriods([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isTransport, form.vehicleId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // Un modele de decoration/des options sont propres a un vehicule :
      // changer de vehicule invalide les choix precedents.
      if (name === 'vehicleId') {
        next.decorationId = '';
        next.optionQuantities = {};
      }
      return next;
    });
  };

  const handleOptionQuantityChange = (optionId, quantity) => {
    setForm((prev) => {
      const nextQuantities = { ...prev.optionQuantities };
      if (quantity > 0) nextQuantities[optionId] = quantity;
      else delete nextQuantities[optionId];
      return { ...prev, optionQuantities: nextQuantities };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'Prénom requis.';
    if (!form.lastName.trim()) nextErrors.lastName = 'Nom requis.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Email invalide.';
    if (!/^\+?\d{8,15}$/.test(form.phone)) nextErrors.phone = 'Téléphone invalide.';

    if (isTransport) {
      if (!form.departureDatetime) nextErrors.departureDatetime = 'Date et heure de départ requises.';
      if (!form.returnDatetime) nextErrors.returnDatetime = 'Date et heure de retour requises.';
      if (
        form.departureDatetime &&
        form.returnDatetime &&
        new Date(form.returnDatetime) <= new Date(form.departureDatetime)
      ) {
        nextErrors.returnDatetime = 'La date de retour doit être postérieure à la date de départ.';
      }
      if (!form.passengers || Number(form.passengers) < 1) {
        nextErrors.passengers = 'Nombre de passagers requis.';
      }
      if (
        !nextErrors.returnDatetime &&
        overlapsReservedPeriod(form.departureDatetime, form.returnDatetime, reservedPeriods)
      ) {
        nextErrors.returnDatetime = 'Ce véhicule est déjà réservé sur cette période. Choisissez d’autres dates.';
      }
    } else if (isProduct) {
      if (!form.quantity || Number(form.quantity) < 1) {
        nextErrors.quantity = 'Quantité requise (au moins 1).';
      }
      if (!form.deliveryDate) {
        nextErrors.deliveryDate = 'Date de livraison souhaitée requise.';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(form.deliveryDate) < today) {
          nextErrors.deliveryDate = 'La date de livraison ne peut pas être dans le passé.';
        }
      }
      if (!form.deliveryMode) {
        nextErrors.deliveryMode = 'Mode requis (retrait ou livraison).';
      }
      if (form.deliveryMode === 'livraison' && !form.deliveryAddress.trim()) {
        nextErrors.deliveryAddress = 'Adresse de livraison requise.';
      }
    } else {
      if (!form.dateFlexible && !form.eventDate) {
        nextErrors.eventDate = "Date requise (ou cochez 'ma date est flexible').";
      }
      if (!form.guests) nextErrors.guests = "Nombre d'invités requis.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = isTransport
        ? {
            listingId,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            departureDatetime: form.departureDatetime,
            returnDatetime: form.returnDatetime,
            passengers: form.passengers,
            vehicleId: form.vehicleId || undefined,
            withDriver: form.withDriver === '' ? undefined : form.withDriver === 'true',
            decorationId: form.decorationId || undefined,
            pickupLocation: form.pickupLocation || undefined,
            options:
              Object.keys(form.optionQuantities).length > 0
                ? Object.entries(form.optionQuantities).map(([vehicleOptionId, quantity]) => ({
                    vehicleOptionId: Number(vehicleOptionId),
                    quantity,
                  }))
                : undefined,
            message: form.message,
          }
        : isProduct
        ? {
            listingId,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            packageId: form.packageId || undefined,
            quantity: form.quantity,
            deliveryDate: form.deliveryDate,
            deliveryMode: form.deliveryMode,
            deliveryAddress: form.deliveryMode === 'livraison' ? form.deliveryAddress : undefined,
            customization: form.customization || undefined,
            message: form.message,
          }
        : { ...form, listingId };

      await createLead(payload);
      setSuccess(true);
      // Les données saisies ne sont jamais effacées en cas d'échec (US-C07) :
      // seul un succès affiche l'écran de confirmation, sinon le formulaire
      // reste rempli pour permettre un nouvel essai.
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Une erreur est survenue. Vos informations ont été conservées, veuillez réessayer.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForInline = () => {
    setForm({
      ...initialState,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      message: initialMessage || '',
      vehicleId: initialVehicleId ? String(initialVehicleId) : '',
      decorationId: initialDecorationId ? String(initialDecorationId) : '',
    });
    setErrors({});
    setSubmitError('');
    setSuccess(false);
  };

  const content = (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {success
            ? 'Demande envoyée'
            : isTransport
            ? 'Demande de location'
            : isProduct
            ? 'Commande de produits'
            : inline
            ? 'Demander un devis'
            : 'Contacter le prestataire'}
        </h2>
        {!inline && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
      </div>

      {success ? (
        <div className="mt-6 text-center">
          <p className="text-gray-700">
            Votre demande a bien été transmise. Le prestataire va vous recontacter directement.
            Un accusé de réception vous a été envoyé par email.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Cette mise en relation est gratuite : aucun paiement n'est traité par la plateforme.
          </p>
          <button
            type="button"
            onClick={inline ? resetForInline : onClose}
            className="mt-6 rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {inline ? 'Envoyer une nouvelle demande' : 'Fermer'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone (+216) *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+21620000000"
                className={inputClass}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            {isTransport ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Départ *</label>
                    <input
                      type="datetime-local"
                      name="departureDatetime"
                      value={form.departureDatetime}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    {errors.departureDatetime && (
                      <p className="mt-1 text-xs text-red-600">{errors.departureDatetime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Retour *</label>
                    <input
                      type="datetime-local"
                      name="returnDatetime"
                      value={form.returnDatetime}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    {errors.returnDatetime && (
                      <p className="mt-1 text-xs text-red-600">{errors.returnDatetime}</p>
                    )}
                  </div>
                </div>

                {reservedPeriods.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <p className="font-semibold">Ce véhicule est déjà réservé sur ces périodes :</p>
                    <ul className="mt-1 space-y-0.5">
                      {reservedPeriods.map((period, index) => (
                        <li key={index}>
                          Du {formatDateTime(period.departureDatetime)} au {formatDateTime(period.returnDatetime)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre de passagers *</label>
                  <input
                    type="number"
                    min="1"
                    name="passengers"
                    value={form.passengers}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  {errors.passengers && <p className="mt-1 text-xs text-red-600">{errors.passengers}</p>}
                </div>

                {vehicles?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Véhicule souhaité</label>
                    <select name="vehicleId" value={form.vehicleId} onChange={handleChange} className={inputClass}>
                      <option value="">Peu importe / à discuter</option>
                      {vehicles.map((v) => {
                        const priceParts = [];
                        if (hasPositivePrice(v.pricePerDay)) priceParts.push(`${v.pricePerDay} DT/j`);
                        if (hasPositivePrice(v.pricePerHour)) priceParts.push(`${v.pricePerHour} DT/h`);
                        return (
                          <option key={v.id} value={v.id}>
                            {[v.brand, v.model].filter(Boolean).join(' ') || VEHICLE_TYPE_LABELS[v.type]} (
                            {VEHICLE_TYPE_LABELS[v.type]}
                            {priceParts.length > 0 ? ` · ${priceParts.join(' · ')}` : ''})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chauffeur</label>
                    <select name="withDriver" value={form.withDriver} onChange={handleChange} className={inputClass}>
                      <option value="">Sélectionner...</option>
                      <option value="true">Avec chauffeur</option>
                      <option value="false">Sans chauffeur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lieu de prise en charge</label>
                    <input
                      name="pickupLocation"
                      value={form.pickupLocation}
                      onChange={handleChange}
                      placeholder="ex : Aéroport Tunis-Carthage"
                      className={inputClass}
                    />
                  </div>
                </div>

                {availableDecorations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Décoration</label>
                    <button
                      type="button"
                      onClick={() => setShowDecorationPicker(true)}
                      className={`${inputClass} flex items-center justify-between gap-2 text-left`}
                    >
                      <span className="flex items-center gap-2">
                        <IconFlower className="h-4 w-4 text-pink-600" />
                        {selectedDecoration ? selectedDecoration.name : 'Aucune décoration sélectionnée'}
                        {selectedDecoration && hasPositivePrice(selectedDecoration.price)
                          ? ` (${selectedDecoration.price} DT)`
                          : ''}
                      </span>
                      <span className="text-xs font-semibold text-rose-600">
                        {selectedDecoration ? 'Modifier' : 'Choisir'}
                      </span>
                    </button>
                  </div>
                )}

                {availableOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Options supplémentaires</label>
                    <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {availableOptions.map((option) => {
                        const quantity = form.optionQuantities[option.id] || 0;
                        const priceLabel = `${option.price} DT${option.pricingType === 'flat' ? '' : ' / Jour'}`;

                        if (option.maxQuantity <= 1) {
                          return (
                            <label
                              key={option.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={quantity > 0}
                                  onChange={(e) => handleOptionQuantityChange(option.id, e.target.checked ? 1 : 0)}
                                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                                />
                                {option.name}
                              </span>
                              <span className="text-xs text-gray-500">{priceLabel}</span>
                            </label>
                          );
                        }

                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          >
                            <div>
                              <p>{option.name}</p>
                              <p className="text-xs text-gray-500">{priceLabel}</p>
                            </div>
                            <select
                              value={quantity}
                              onChange={(e) => handleOptionQuantityChange(option.id, Number(e.target.value))}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            >
                              {Array.from({ length: option.maxQuantity + 1 }, (_, n) => n).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : isProduct ? (
              <>
                {products?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Produit souhaité</label>
                    <select name="packageId" value={form.packageId} onChange={handleChange} className={inputClass}>
                      <option value="">Autre / à définir</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {hasPositivePrice(p.price) ? ` (${p.price} DT)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantité *</label>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Livraison souhaitée *</label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={form.deliveryDate}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    {errors.deliveryDate && <p className="mt-1 text-xs text-red-600">{errors.deliveryDate}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mode *</label>
                  <select name="deliveryMode" value={form.deliveryMode} onChange={handleChange} className={inputClass}>
                    <option value="">Sélectionner...</option>
                    <option value="retrait">Retrait</option>
                    <option value="livraison">Livraison</option>
                  </select>
                  {errors.deliveryMode && <p className="mt-1 text-xs text-red-600">{errors.deliveryMode}</p>}
                </div>

                {form.deliveryMode === 'livraison' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse de livraison *</label>
                    <input
                      name="deliveryAddress"
                      value={form.deliveryAddress}
                      onChange={handleChange}
                      placeholder="ex : 12 rue de la Liberté, Sfax"
                      className={inputClass}
                    />
                    {errors.deliveryAddress && (
                      <p className="mt-1 text-xs text-red-600">{errors.deliveryAddress}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Personnalisation</label>
                  <textarea
                    name="customization"
                    value={form.customization}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Couleurs, étiquette, nom des mariés..."
                    className={inputClass}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de l&apos;événement</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={form.eventDate}
                    onChange={handleChange}
                    disabled={form.dateFlexible}
                    className={`${inputClass} disabled:bg-gray-100`}
                  />
                  {errors.eventDate && <p className="mt-1 text-xs text-red-600">{errors.eventDate}</p>}
                  <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      name="dateFlexible"
                      checked={form.dateFlexible}
                      onChange={handleChange}
                    />
                    Ma date est flexible
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre d&apos;invités *</label>
                  <select name="guests" value={form.guests} onChange={handleChange} className={inputClass}>
                    <option value="">Sélectionner...</option>
                    {GUEST_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                  {errors.guests && <p className="mt-1 text-xs text-red-600">{errors.guests}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                className={inputClass}
              />
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        )}
    </>
  );

  const decorationPicker = showDecorationPicker && (
    <DecorationPickerModal
      decorations={availableDecorations}
      selectedId={selectedDecoration?.id ?? null}
      vehicleLabel={`${selectedVehicle?.brand || ''} ${selectedVehicle?.model || ''}`.trim()}
      onClose={() => setShowDecorationPicker(false)}
      onConfirm={(decorationId) => {
        setForm((prev) => ({ ...prev, decorationId: decorationId ? String(decorationId) : '' }));
        setShowDecorationPicker(false);
      }}
    />
  );

  if (inline) {
    return (
      <div>
        {content}
        {decorationPicker}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {content}
      </div>
      {decorationPicker}
    </div>
  );
}

export default ContactForm;
