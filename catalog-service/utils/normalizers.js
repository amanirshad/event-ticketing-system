const { EVENT_STATUSES, SEAT_STATUSES } = require('../src/constants');

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
