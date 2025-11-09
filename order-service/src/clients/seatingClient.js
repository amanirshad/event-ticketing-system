const axios = require('axios');
const seatingBase = process.env.SEATING_URL || 'http://localhost:4000';

async function reserveSeats(userId, eventId, seats) {
  const url = `${seatingBase}/v1/seats/reserve`;
  const resp = await axios.post(url, { userId, eventId, seats });
  return resp.data;
}

async function allocateSeats(holdId) {
  const url = `${seatingBase}/v1/seats/allocate`;
  const resp = await axios.post(url, { holdId });
  return resp.data;
}

async function releaseSeats(holdIdOrSeat) {
  const url = `${seatingBase}/v1/seats/release`;
  const resp = await axios.post(url, { holdId: holdIdOrSeat });
  return resp.data;
}

module.exports = { reserveSeats, allocateSeats, releaseSeats };
