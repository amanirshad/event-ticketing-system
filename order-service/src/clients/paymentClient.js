const axios = require('axios');
const paymentBase = process.env.PAYMENT_URL || 'http://localhost:5000';

async function charge(idempotencyKey, amount, currency, metadata) {
  const url = `${paymentBase}/v1/charge`;
  const headers = {};
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const resp = await axios.post(url, { amount, currency, metadata }, { headers });
  return resp.data;
}

module.exports = { charge };
