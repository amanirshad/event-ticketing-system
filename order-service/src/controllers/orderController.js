const db = require('../db');

const { v4: uuidv4 } = require('uuid');

const TAX_RATE = 0.05;

//  Utility to calculate totals
function computeTotals(seatItems) {
  const subtotal = seatItems.reduce(
    (s, it) => s + parseFloat(it.price) * (it.quantity || 1),
    0
  );
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  return { subtotal, tax, total };
}

// ---------------------- CREATE ORDER ----------------------
exports.createOrder = async (req, res) => {
  const payload = req.body;

  try {
    // Mock seating reservation
    const reserveResp = {
      success: true,
      hold_id: 'mock-hold-id',
      seats:
        payload.seats?.map((s, i) => ({
          seat_id: `mock-seat-${i + 1}`,
          price: s.price || 100,
          label: s.label || `Seat-${i + 1}`,
        })) || [],
    };

    if (!reserveResp.success) {
      return res.status(409).json({ error: 'Seats could not be reserved' });
    }

    const authoritativeSeats = reserveResp.seats;
    const seatItems = authoritativeSeats.map((s) => ({
      seat_id: s.seat_id,
      price: parseFloat(s.price),
      seat_label: s.label,
      quantity: 1,
    }));

    const totals = computeTotals(seatItems);
    const externalId = uuidv4();

    // 🗃️ Insert order
    const [orderInsertResult] = await db('orders').insert({
      external_id: externalId,
      user_id: parseInt(payload.userId, 10) || 1, // ensure integer
      status: 'PENDING',
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: 'USD',
    });

    const orderId =
      typeof orderInsertResult === 'object' && orderInsertResult !== null
        ? orderInsertResult.id
        : orderInsertResult;

    // 💺 Insert order line items
    for (const s of seatItems) {
      await db('order_line_items').insert({
        order_id: orderId,
        seat_id: s.seat_id,
        seat_label: s.seat_label,
        price: s.price,
      });
    }

    // Mock payment success
    const paymentResp = {
      status: 'SUCCESS',
      payment_id: 1,
    };

    if (paymentResp.status !== 'SUCCESS') {
      await db('orders').where({ id: orderId }).update({ status: 'CANCELLED' });
      return res.status(402).json({ error: 'Payment failed' });
    }

    // Mock seat allocation success
    const allocateResp = { success: true };
    if (!allocateResp.success) {
      await db('orders').where({ id: orderId }).update({ status: 'CANCELLED' });
      return res.status(500).json({ error: 'Failed to allocate seats' });
    }

    // Update order to confirmed
    await db('orders')
      .where({ id: orderId })
      .update({ status: 'CONFIRMED', payment_id: paymentResp.payment_id });

    // Generate tickets
    const tickets = [];
    for (const s of seatItems) {
      const ticketRef = `TKT-${uuidv4()}`;
      const [ticketInsertResult] = await db('tickets').insert({
        order_id: orderId,
        ticket_ref: ticketRef,
        seat_id: s.seat_id,
        seat_label: s.seat_label,
        price: s.price,
        status: 'ISSUED',
      });

      const ticketId =
        typeof ticketInsertResult === 'object' && ticketInsertResult !== null
          ? ticketInsertResult.id
          : ticketInsertResult;

      tickets.push({
        id: ticketId,
        ticket_ref: ticketRef,
        seat_id: s.seat_id,
        price: s.price,
      });
    }

    // Final response
    const order = await db('orders').where({ id: orderId }).first();
    return res.status(201).json({ order, tickets });
  } catch (err) {
    console.error('createOrder error', err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal Server Error' });
  }
};

// ---------------------- GET SINGLE ORDER ----------------------
exports.getOrder = async (req, res) => {
  const id = req.params.id;
  const order = await db('orders').where({ id }).first();
  if (!order) return res.status(404).json({ error: 'not found' });

  const items = await db('order_line_items').where({ order_id: id });
  const tickets = await db('tickets').where({ order_id: id });
  res.json({ order, items, tickets });
};

// ---------------------- LIST ALL ORDERS ----------------------
exports.listOrders = async (req, res) => {
  const rows = await db('orders')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(100);
  res.json(rows);
};

// ---------------------- CANCEL ORDER ----------------------
exports.cancelOrder = async (req, res) => {
  const id = req.params.id;
  const order = await db('orders').where({ id }).first();

  if (!order) return res.status(404).json({ error: 'not found' });
  if (order.status !== 'PENDING')
    return res
      .status(400)
      .json({ error: 'only pending orders can be cancelled' });

  await db('orders').where({ id }).update({ status: 'CANCELLED' });
  res.json({ success: true });
};
