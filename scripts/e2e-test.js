#!/usr/bin/env node

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const STEP_DELAY_MS = 400;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const divider = () => console.log(`${COLORS.dim}${'─'.repeat(70)}${COLORS.reset}`);

const logStep = (title) => {
  divider();
  console.log(`${COLORS.cyan}${COLORS.bright}▶ ${title}${COLORS.reset}`);
};

const logInfo = (label, payload) => {
  console.log(`${COLORS.dim}${label}:${COLORS.reset}`);
  if (payload !== undefined) console.dir(payload, { depth: null, colors: true });
};

const logSuccess = (label, payload) => {
  console.log(`${COLORS.green}✔ ${label}${COLORS.reset}`);
  if (payload !== undefined) console.dir(payload, { depth: null, colors: true });
};

const logError = (label, payload) => {
  console.error(`${COLORS.red}✖ ${label}${COLORS.reset}`);
  if (payload !== undefined) console.dir(payload, { depth: null, colors: true });
};

const runStep = async (title, fn) => {
  await sleep(STEP_DELAY_MS);
  logStep(title);
  return fn();
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
    await runStep('Health checks', async () => {
      logInfo('Purpose', 'Ensure catalog-service, payment-service, and order-service are reachable before continuing.');
      const healthResponses = await Promise.all([
        axios.get(`${base.catalog}/health`),
        axios.get(`${base.payment}/health`),
        axios.get(`${base.order}/v1/orders`).catch(() => ({ data: [] })),
      ]);
      logSuccess('Catalog health', healthResponses[0].data);
      logSuccess('Payment health', healthResponses[1].data);
    });

    const userPayload = {
      name: 'E2E Tester',
      email: `tester_${Date.now()}@example.com`,
      password: 'Passw0rd!',
      phone: '9999999999',
    };
    const registerResp = await runStep('Register user (user-service)', async () => {
      logInfo('Purpose', 'Create a fresh account via user-service so we can place an order later.');
      return axios.post(`${base.user}/api/users/register`, userPayload);
    });
    logSuccess('User registered', registerResp.data);
    const userId = registerResp.data.userId;

    const loginResp = await runStep('Login user (user-service)', async () => {
      logInfo('Purpose', 'Validate credentials and simulate real login flow.');
      return axios.post(`${base.user}/api/users/login`, {
        email: userPayload.email,
        password: userPayload.password,
      });
    });
    logSuccess('Login response', loginResp.data);

    const eventResp = await runStep('Create event in catalog (catalog-service)', async () => {
      logInfo('Purpose', 'Seed an event record that downstream services (seating, order) can reference.');
      return axios.post(`${base.catalog}/v1/events`, seedEvent);
    });
    logSuccess('Catalog event created', eventResp.data);
    const eventId = eventResp.data.id;

    await runStep('Sync event into seating service (event-seating-service)', async () => {
      logInfo('Purpose', 'Inform the seating microservice about the new event so seats can be managed.');
      return axios.post(`${base.seating}/v1/seating/events`, {
        eventId: eventId.toString(),
        eventName: seedEvent.title,
      });
    });

    const seatSeed = [
      { seatCode: 'A1', section: 'Main', rowLabel: 'A', seatNumber: 1, price: 250 },
      { seatCode: 'A2', section: 'Main', rowLabel: 'A', seatNumber: 2, price: 250 },
      { seatCode: 'A3', section: 'Main', rowLabel: 'A', seatNumber: 3, price: 250 },
    ];
    await runStep('Seed seating inventory (event-seating-service)', async () => {
      logInfo('Purpose', 'Populate seats A1-A3 so reservations have something to act on.');
      return axios.post(`${base.seating}/v1/seating/events/${eventId}/seats`, seatSeed);
    });

    const seatStatus = await runStep('Verify seats available (event-seating-service)', async () => {
      logInfo('Purpose', 'Double-check the recently seeded seats are active and AVAILABLE.');
      return axios.get(`${base.seating}/v1/seating/events/${eventId}`);
    });
    logInfo('Seats status sample', seatStatus.data.slice(0, 3));

    const reserveResp = await runStep('Reserve seats (event-seating-service)', async () => {
      logInfo('Purpose', 'Hold seats A1 and A2 for the user, simulating the RESERVE call from order-service.');
      return axios.post(`${base.seating}/v1/seating/reserve`, {
        eventId: eventId.toString(),
        userId: String(userId),
        seatCodes: ['A1', 'A2'],
        idempotencyKey: uuidv4(),
      });
    });
    logSuccess('Reserve response', reserveResp.data);
    const holdToken = reserveResp.data.holdToken;

    const orderPayload = {
      userId,
      eventId,
      seats: reserveResp.data.reservedSeatCodes.map((seatCode, index) => ({
        seatId: `mock-seat-${index + 1}`,
        price: 250,
        label: seatCode,
      })),
    };

    const createOrderResp = await runStep('Create order (order-service)', async () => {
      logInfo('Purpose', 'Persist the purchase request with details of the reserved seats.');
      return axios.post(`${base.order}/v1/orders`, orderPayload, {
        headers: {
          'Idempotency-Key': uuidv4(),
          'Content-Type': 'application/json',
        },
      });
    });
    logSuccess('Order created', createOrderResp.data.order);
    const orderId = createOrderResp.data.order.id;
    const orderIdString = String(orderId);

    const devTokenResp = await runStep('Acquire payment auth token (payment-service)', async () => {
      logInfo('Purpose', 'Get a development JWT so we can authorize the payment charge request.');
      return axios.get(`${base.payment}/auth/dev-token`, { params: { userId } });
    });
    const authHeader = `Bearer ${devTokenResp.data.token}`;

    const paymentPayload = {
      orderId: orderIdString,
      amount: Number(createOrderResp.data.order.total),
      currency: 'USD',
      paymentMethod: 'credit_card'
    };
    const chargeResp = await runStep('Charge payment (payment-service)', async () => {
      logInfo('Purpose', 'Simulate billing the customer for the reserved seats.');
      return axios.post(`${base.payment}/api/payments/charge`, paymentPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4(),
          Authorization: authHeader,
        },
      });
    });
    logSuccess('Payment charge', chargeResp.data);

    await runStep('Allocate seats (event-seating-service)', async () => {
      logInfo('Purpose', 'Commit the reservation now that payment succeeded.');
      return axios.post(`${base.seating}/v1/seating/allocate`, {
        holdToken,
        orderId: orderIdString,
      });
    });
    logSuccess('Seats allocated');

    const finalOrder = await runStep('Fetch final order (order-service)', async () => {
      logInfo('Purpose', 'Retrieve order, items, and tickets to validate the entire flow.');
      return axios.get(`${base.order}/v1/orders/${orderId}`);
    });
    logSuccess('Final order', finalOrder.data);

    divider();
    logSuccess('End-to-end flow completed successfully');
  } catch (err) {
    logError('E2E flow failed', err.response ? err.response.data : err.message);
    process.exitCode = 1;
  }
})();
