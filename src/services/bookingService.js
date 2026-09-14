import api from './api';

export const getMyBookings = () => api.get('/bookings/me').then((res) => res.data);

export const getListingBookings = (listingId) =>
  api.get(`/listings/${listingId}/bookings`).then((res) => res.data);

export const createBooking = (payload) => api.post('/bookings', payload).then((res) => res.data);

export const updateBooking = (id, payload) =>
  api.patch(`/bookings/${id}`, payload).then((res) => res.data);

export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status }).then((res) => res.data);

export const deleteBooking = (id) => api.delete(`/bookings/${id}`).then((res) => res.data);
