import { apiClient } from "./apiClient";

function createMapCache(ttl) {
  return {
    ttl,
    values: new Map(),
    promises: new Map(),
  };
}

const analyticsCache = createMapCache(60 * 1000);
const monthlyCache = createMapCache(60 * 1000);
const scheduleCache = createMapCache(5 * 60 * 1000);

function getCachedEntry(cache, key) {
  const entry = cache.values.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.values.delete(key);
    return null;
  }

  return entry.value;
}

async function getCachedMapValue(cache, key, loader, { force = false } = {}) {
  if (!force) {
    const cachedValue = getCachedEntry(cache, key);
    if (cachedValue !== null) {
      return cachedValue;
    }
  }

  if (cache.promises.has(key)) {
    return cache.promises.get(key);
  }

  const promise = loader()
    .then((value) => {
      cache.values.set(key, {
        value,
        expiresAt: Date.now() + cache.ttl,
      });
      return value;
    })
    .finally(() => {
      cache.promises.delete(key);
    });

  cache.promises.set(key, promise);
  return promise;
}

function clearAttendanceCache() {
  analyticsCache.values.clear();
  analyticsCache.promises.clear();
  monthlyCache.values.clear();
  monthlyCache.promises.clear();
  scheduleCache.values.clear();
  scheduleCache.promises.clear();
}

export function getLocalDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - offset * 60000);
  return localTime.toISOString().slice(0, 10);
}

export function hydrateAttendanceForDate(stylists = [], dateString) {
  return stylists.map((stylist) => {
    const savedCheckIn = localStorage.getItem(
      `attendance_${dateString}_${stylist._id}`,
    );
    const savedStatus = localStorage.getItem(
      `attendance_status_${dateString}_${stylist._id}`,
    );
    const savedCheckout = localStorage.getItem(
      `checkout_${dateString}_${stylist._id}`,
    );

    return {
      ...stylist,
      checkInTime: savedCheckIn || null,
      checkoutTime: savedCheckout || null,
      status: savedStatus || null,
    };
  });
}

export async function markAttendance(payload) {
  const response = await apiClient.post("/api/attendance/mark", payload);
  clearAttendanceCache();
  return response.data;
}

export async function getAttendanceAnalytics(stylistId, options = {}) {
  return getCachedMapValue(
    analyticsCache,
    stylistId,
    async () => {
      const response = await apiClient.get("/api/attendance/analytics", {
        params: { stylistId },
      });
      return response.data;
    },
    options,
  );
}

export async function getAttendanceMonthly(stylistId, month, options = {}) {
  const [year, monthNumber] = month.split("-");
  const cacheKey = `${stylistId}:${month}`;

  return getCachedMapValue(
    monthlyCache,
    cacheKey,
    async () => {
      const response = await apiClient.get("/api/attendance/monthly", {
        params: {
          stylistId,
          month: monthNumber,
          year,
        },
      });
      return response.data;
    },
    options,
  );
}

export async function getAttendanceSchedule(stylistId, options = {}) {
  return getCachedMapValue(
    scheduleCache,
    stylistId,
    async () => {
      const response = await apiClient.get("/api/attendance/schedule", {
        params: { stylistId },
      });
      return response.data?.data || response.data;
    },
    options,
  );
}
