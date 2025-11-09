#!/usr/bin/env node

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logStep = (title, detail) => {
  console.log(`\n=== ${title} ===`);
  if (detail) console.log(detail);
};

(async () => {
  const base = {
    user: 'http://localhost:8080',
    catalog: 'http://localhost:3002',
    seating: 'http://localhost:4000',
    order: 'http://localhost:3007',
    payment: 'http://localhost:3004',
  };

  const seedEvent = {
    title: 'Demo Concert',
    eventType: 'Concert',
    status: 'ON_SALE',
    eventDate: new Date(Date.now() + 86400000).toISOString(),
    basePrice: 250.0,
    currency: 'INR',
    venueId: 91,
    isPublished: true,
  };

  try {
    logStep('Health checks');
    const healthResponses = await Promise.all([
      axios.get(`${base.catalog}/health`),
      axios.get(`${base.payment}/health`),
      axios.get(`${base.order}/v1/orders`).catch(() => ({ data: [] })),
    ]);
    console.log('Catalog health:', healthResponses[0].data);
    console.log('Payment health:', healthResponses[1].data);

    logStep('Register user');
    const userPayload = {
      name: 'E2E Tester',
      email: `tester_${Date.now()}@example.com`,
      password: 'Passw0rd!',
      phone: '9999999999',
    };
    const registerResp = await axios.post(`${base.user}/api/users/register`, userPayload);
    console.log('Register response:', registerResp.data);
    const userId = registerResp.data.userId;

    logStep('Login user');
    const loginResp = await axios.post(`${base.user}/api/users/login`, {
      email: userPayload.email,
      password: userPayload.password,
    });
    console.log('Login response:', loginResp.data);

    logStep('Create event in catalog');
    const eventResp = await axios.post(`${base.catalog}/v1/events`, seedEvent);
    console.log('Catalog event created:', eventResp.data);
    const eventId = eventResp.data.id;

    logStep('Sync event into seating service');
    await axios.post(`${base.seating}/v1/seating/events`, {
      eventId: eventId.toString(),
      eventName: seedEvent.title,
    });

    logStep('Seed seating inventory');
    const seatSeed = [
      { seatCode: 'A1', section: 'Main', rowLabel: 'A', seatNumber: 1, price: 250 },
      { seatCode: 'A2', section: 'Main', rowLabel: 'A', seatNumber: 2, price: 250 },
      { seatCode: 'A3', section: 'Main', rowLabel: 'A', seatNumber: 3, price: 250 },
    ];
    await axios.post(`${base.seating}/v1/seating/events/${eventId}/seats`, seatSeed);

    logStep('Verify seats available');
    const seatStatus = await axios.get(`${base.seating}/v1/seating/events/${eventId}`);
    console.log('Seats status sample:', seatStatus.data.slice(0, 3));

    logStep('Reserve seats');
    const reserveResp = await axios.post(`${base.seating}/v1/seating/reserve`, {
      eventId: eventId.toString(),
      userId: String(userId),
      seatCodes: ['A1', 'A2'],
      idempotencyKey: uuidv4(),
    });
    console.log('Reserve response:', reserveResp.data);
    const holdToken = reserveResp.data.holdToken;

    logStep('Create order');
    const orderPayload = {
      userId,
      eventId,
      seats: reserveResp.data.reservedSeatCodes.map((seatCode, index) => ({
        seatId: `mock-seat-${index + 1}`,
        price: 250,
        label: seatCode,
      })),
    };

    const createOrderResp = await axios.post(`${base.order}/v1/orders`, orderPayload, {
      headers: {
        'Idempotency-Key': uuidv4(),
        'Content-Type': 'application/json',
      },
    });
    console.log('Order created:', createOrderResp.data.order);
    const orderId = createOrderResp.data.order.id;
    const orderIdString = String(orderId);

    logStep('Acquire payment auth token');
    const devTokenResp = await axios.get(`${base.payment}/auth/dev-token`, {
      params: { userId },
    });
    const authHeader = `Bearer ${devTokenResp.data.token}`;

    logStep('Charge payment');
    const paymentPayload = {
      orderId: orderIdString,
      amount: Number(createOrderResp.data.order.total),
      currency: 'USD',
      paymentMethod: 'credit_card'
    };
    const chargeResp = await axios.post(`${base.payment}/api/payments/charge`, paymentPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': uuidv4(),
        Authorization: authHeader,
      },
    });
    console.log('Payment charge:', chargeResp.data);

    logStep('Allocate seats');
    await axios.post(`${base.seating}/v1/seating/allocate`, {
      holdToken,
      orderId: orderIdString,
    });
    console.log('Seats allocated');

    logStep('Fetch final order');
    const finalOrder = await axios.get(`${base.order}/v1/orders/${orderId}`);
    console.log('Final order:', finalOrder.data);

    logStep('End-to-end flow completed successfully');
  } catch (err) {
    console.error('E2E flow failed:', err.response ? err.response.data : err.message);
    process.exitCode = 1;
  }
})();
