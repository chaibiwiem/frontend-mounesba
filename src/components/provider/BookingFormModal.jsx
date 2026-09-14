import { useState } from 'react';
import { estimateRentalPrice } from '../../utils/rentalPricing';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 disabled:text-gray-500';
const labelClass = 'block text-xs font-medium text-gray-700';

function BookingFormModal({ lead, initialDate, onSave, onCancel }) {
  // Demande de location Transport : le prix se deduit des dates + du tarif
  // (heure ou jour) du vehicule choisi, plutot que d'une saisie manuelle a vide.
  const estimate = lead
    ? estimateRentalPrice(
        lead.departureDatetime,
        lead.returnDatetime,
        lead.vehicle,
        lead.decoration,
        lead.selectedOptions
      )
    : null;

  const [form, setForm] = useState({
    clientName: lead ? `${lead.firstName} ${lead.lastName}` : '',
    clientEmail: lead ? lead.email || '' : '',
    clientPhone: lead ? lead.phone || '' : '',
    eventDate: lead?.eventDate || initialDate || '',
    startTime: '',
    endTime: '',
    totalPrice: estimate ? String(estimate.amount) : '',
    deposit: '',
    paymentMethod: 'cash',
    notes: '',
  });
  const [priceEdited, setPriceEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalPrice') setPriceEdited(true);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.clientName.trim()) {
      setError('Le nom du client est requis.');
      return;
    }

    const payload = {
      clientName: form.clientName,
      totalPrice: form.totalPrice || undefined,
      deposit: form.deposit || undefined,
      paymentMethod: form.paymentMethod || undefined,
      notes: form.notes || undefined,
    };
    if (form.clientEmail) payload.clientEmail = form.clientEmail;
    if (form.clientPhone) payload.clientPhone = form.clientPhone;
    if (lead) payload.leadId = lead.id;

    // Demande de location Transport avec vehicule choisi : reservation
    // enregistree comme VehicleBooking (periode depart/retour, anti-
    // chevauchement) plutot que Booking generique (date d'evenement unique) -
    // voir LeadsTab.handleCreateBookingFromLead, qui route vers le bon
    // endpoint selon la presence de vehicleId.
    if (lead?.vehicleId) {
      payload.vehicleId = lead.vehicleId;
      payload.departureDatetime = lead.departureDatetime;
      payload.returnDatetime = lead.returnDatetime;
    } else {
      payload.eventDate = form.eventDate || undefined;
      payload.startTime = form.startTime || undefined;
      payload.endTime = form.endTime || undefined;
    }

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Impossible d'enregistrer cette réservation."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Enregistrer une réservation</h3>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Enregistrement d'un accord conclu en direct. Aucun paiement n'est traité par la
          plateforme.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {lead && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Réservation liée à la demande de{' '}
              <span className="font-medium text-gray-900">
                {lead.firstName} {lead.lastName}
              </span>
              . Cette demande passera au statut « Confirmées ».
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Nom du client</label>
              <input
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                disabled={Boolean(lead)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="clientEmail"
                value={form.clientEmail}
                onChange={handleChange}
                disabled={Boolean(lead)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input
                name="clientPhone"
                value={form.clientPhone}
                onChange={handleChange}
                disabled={Boolean(lead)}
                className={inputClass}
              />
            </div>
          </div>

          {lead?.departureDatetime && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Location du {new Date(lead.departureDatetime).toLocaleString('fr-FR')} au{' '}
              {new Date(lead.returnDatetime).toLocaleString('fr-FR')}
              {lead.decoration && ` · Décoration : ${lead.decoration.name}`}
              {lead.selectedOptions?.length > 0 &&
                ` · Options : ${lead.selectedOptions
                  .map((s) => `${s.option?.name}${s.quantity > 1 ? ` x${s.quantity}` : ''}`)
                  .join(', ')}`}
            </div>
          )}

          {!lead?.departureDatetime && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Date de l'événement</label>
                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Heure de début</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Heure de fin</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant total (DT)</label>
              <input
                type="number"
                name="totalPrice"
                value={form.totalPrice}
                onChange={handleChange}
                className={inputClass}
              />
              {estimate && (
                <p className="mt-1 text-xs text-gray-500">
                  {estimate.unit && (
                    <>
                      {estimate.quantity} {estimate.unit}
                      {estimate.quantity > 1 ? 's' : ''} × {estimate.rate} DT/
                      {estimate.unit === 'heure' ? 'h' : 'j'}
                      {estimate.decorationAmount > 0 ? ` + ${estimate.decorationAmount} DT décoration` : ''}
                      {estimate.optionsAmount > 0 ? ` + ${estimate.optionsAmount} DT options` : ''} ={' '}
                    </>
                  )}
                  {estimate.amount} DT
                  {priceEdited && Number(form.totalPrice) !== estimate.amount && (
                    <button
                      type="button"
                      onClick={() => {
                        setPriceEdited(false);
                        setForm((prev) => ({ ...prev, totalPrice: String(estimate.amount) }));
                      }}
                      className="ml-1 font-semibold text-rose-600 hover:underline"
                    >
                      Utiliser ce montant
                    </button>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Acompte (DT)</label>
              <input
                type="number"
                name="deposit"
                value={form.deposit}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Mode de règlement</label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="cash">Cash</option>
              <option value="rib">Virement (RIB)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Notes privées</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
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

export default BookingFormModal;
