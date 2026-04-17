import { apiClient, extractArray } from "./apiClient";

const BOOKING_CACHE_TTL = 30 * 1000;
const STYLIST_CACHE_TTL = 60 * 1000;
const SERVICE_CACHE_TTL = 60 * 1000;

function createTimedCache(ttl) {
  return {
    ttl,
    data: null,
    expiresAt: 0,
    promise: null,
  };
}

const bookingsCache = createTimedCache(BOOKING_CACHE_TTL);
const stylistsCache = createTimedCache(STYLIST_CACHE_TTL);
const servicesCache = createTimedCache(SERVICE_CACHE_TTL);

function isCacheFresh(cache) {
  return cache.expiresAt > Date.now() && cache.data !== null;
}

async function getCachedValue(cache, loader, { force = false } = {}) {
  if (!force && isCacheFresh(cache)) {
    return cache.data;
  }

  if (cache.promise) {
    return cache.promise;
  }

  cache.promise = loader()
    .then((data) => {
      cache.data = data;
      cache.expiresAt = Date.now() + cache.ttl;
      return data;
    })
    .finally(() => {
      cache.promise = null;
    });

  return cache.promise;
}

function updateCache(cache, nextValue) {
  cache.data = nextValue;
  cache.expiresAt = Date.now() + cache.ttl;
}

export function invalidateBookingsCache() {
  bookingsCache.data = null;
  bookingsCache.expiresAt = 0;
}

export function getServiceTotal(services = []) {
  if (!Array.isArray(services)) return 0;

  return services.reduce((sum, service) => {
    return sum + (Number(service?.price) || 0);
  }, 0);
}

export function getBookingAmount(booking, { preferFinalAmount = true } = {}) {
  if (!booking || typeof booking !== "object") return 0;

  if (preferFinalAmount && booking.finalAmount != null) {
    return Number(booking.finalAmount) || 0;
  }

  return getServiceTotal(booking.services);
}

export async function getBookings(options = {}) {
  return getCachedValue(
    bookingsCache,
    async () => {
      const response = await apiClient.get("/api/bookings");
      return extractArray(response, ["bookings"]);
    },
    options,
  );
}

export function setBookingsCache(bookings) {
  updateCache(bookingsCache, Array.isArray(bookings) ? bookings : []);
}

export async function updateBooking(id, payload) {
  const response = await apiClient.put(`/api/bookings/${id}`, payload);
  const updatedBooking = response.data?.booking || response.data;

  if (Array.isArray(bookingsCache.data) && updatedBooking?._id) {
    updateCache(
      bookingsCache,
      bookingsCache.data.map((booking) =>
        booking._id === updatedBooking._id ? updatedBooking : booking,
      ),
    );
  } else {
    invalidateBookingsCache();
  }

  return updatedBooking;
}

export async function deleteBookings(ids = []) {
  await Promise.all(ids.map((id) => apiClient.delete(`/api/bookings/${id}`)));

  if (Array.isArray(bookingsCache.data) && ids.length > 0) {
    updateCache(
      bookingsCache,
      bookingsCache.data.filter((booking) => !ids.includes(booking?._id)),
    );
    return;
  }

  invalidateBookingsCache();
}

export async function getActiveStylists(options = {}) {
  return getCachedValue(
    stylistsCache,
    async () => {
      const response = await apiClient.get("/api/stylists");
      const stylists = extractArray(response, ["stylists"]);

      return stylists.filter(
        (stylist) =>
          (stylist.status || "").toString().toLowerCase() === "active",
      );
    },
    options,
  );
}

export async function getManageServices(options = {}) {
  return getCachedValue(
    servicesCache,
    async () => {
      const response = await apiClient.get("/api/manageservices");
      return extractArray(response, ["services"]);
    },
    options,
  );
}
