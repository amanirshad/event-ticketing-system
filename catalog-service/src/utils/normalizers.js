const EVENT_STATUSES = new Set(['ON_SALE', 'SOLD_OUT', 'CANCELLED', 'SCHEDULED']);
const SEAT_STATUSES = new Set(['AVAILABLE', 'ON_HOLD', 'SOLD']);

const normalizeEventStatus = (status) => {
  if (!status) return null;
  const normalized = status.toString().trim().toUpperCase();
  return EVENT_STATUSES.has(normalized) ? normalized : null;
};

const normalizeSeatStatus = (status) => {
  if (!status) return 'AVAILABLE';
  const normalized = status.toString().trim().toUpperCase();
  return SEAT_STATUSES.has(normalized) ? normalized : 'AVAILABLE';
};

module.exports = {
  normalizeEventStatus,
  normalizeSeatStatus,
};
