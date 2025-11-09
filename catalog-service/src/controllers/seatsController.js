const db = require('../db');
const { normalizeSeatStatus } = require('../../utils/normalizers');
const { helpers: eventHelpers } = require('./eventsController');

const parseMetadata = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return null;
  }
};

const mapSeatRow = (row, event = null) => ({
  id: row.id,
  legacyId: row.legacy_id,
  eventId: row.event_id,
  section: row.section,
  rowLabel: row.row_label,
  seatNumber: row.seat_number,
  price: row.price !== undefined && row.price !== null ? Number(row.price) : null,
  status: row.status,
  metadata: parseMetadata(row.metadata),
  event,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildSeatPayload = (body, existing = {}) => {
  const {
    legacyId,
    eventId,
    section,
    rowLabel,
    seatNumber,
    price,
    status,
    metadata,
  } = body;

  const payload = {};

  if (legacyId !== undefined) payload.legacy_id = legacyId || null;

  if (eventId !== undefined) {
    if (!eventId) {
      const err = new Error('eventId is required');
      err.status = 400;
      throw err;
    }
    payload.event_id = Number(eventId);
  }

  if (section !== undefined) {
    if (!section) {
      const err = new Error('section is required');
      err.status = 400;
      throw err;
    }
    payload.section = section;
  }

  if (rowLabel !== undefined) {
    if (!rowLabel) {
      const err = new Error('rowLabel is required');
      err.status = 400;
      throw err;
    }
    payload.row_label = rowLabel;
  }

  if (seatNumber !== undefined) {
    if (!seatNumber) {
      const err = new Error('seatNumber is required');
      err.status = 400;
      throw err;
    }
    payload.seat_number = String(seatNumber);
  }

  if (price !== undefined) {
    payload.price = price === null ? null : Number(price);
  }

  if (status !== undefined) {
    const normalized = normalizeSeatStatus(status);
    payload.status = normalized;
  }

  if (metadata !== undefined) {
    if (metadata === null) {
      payload.metadata = null;
    } else if (typeof metadata === 'object') {
      payload.metadata = JSON.stringify(metadata);
    } else if (typeof metadata === 'string') {
      payload.metadata = metadata;
    }
  }

  return payload;
};

exports.listSeats = async (req, res, next) => {
  try {
    const {
      eventId,
      status,
      section,
      row: rowLabel,
      minPrice,
      maxPrice,
      includeEvent,
    } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = (page - 1) * limit;

    const baseQuery = db('seats');

    if (eventId) {
      const eventIds = Array.isArray(eventId)
        ? eventId.map(Number)
        : String(eventId)
            .split(',')
            .map((id) => Number(id.trim()))
            .filter(Boolean);
      if (eventIds.length) {
        baseQuery.whereIn('event_id', eventIds);
      }
    }

    if (status) {
      const statuses = (Array.isArray(status) ? status : status.split(','))
        .map((value) => normalizeSeatStatus(value))
        .filter(Boolean);
      if (statuses.length) {
        baseQuery.whereIn('status', statuses);
      }
    }

    if (section) {
      baseQuery.whereILike('section', `%${section}%`);
    }

    if (rowLabel) {
      baseQuery.whereILike('row_label', `%${rowLabel}%`);
    }

    if (minPrice) {
      baseQuery.where('price', '>=', Number(minPrice));
    }

    if (maxPrice) {
      baseQuery.where('price', '<=', Number(maxPrice));
    }

    const totalResult = await baseQuery.clone().count({ total: '*' }).first();
    const total = totalResult ? Number(totalResult.total || 0) : 0;

    const rows = await baseQuery.clone().orderBy(['event_id', 'section', 'row_label', 'seat_number']).limit(limit).offset(offset);

    let eventMap = {};
    const shouldIncludeEvent = String(includeEvent).toLowerCase() === 'true';
    if (shouldIncludeEvent && rows.length) {
      const eventIds = [...new Set(rows.map((seat) => seat.event_id))];
      const eventRows = await db('events')
        .leftJoin('venues', 'events.venue_id', 'venues.id')
        .whereIn('events.id', eventIds);
      const seatSummary = await eventHelpers.buildSeatSummary(eventIds);
      eventMap = eventRows.reduce((acc, eventRow) => {
        acc[eventRow.id] = eventHelpers.mapEventRow(eventRow, seatSummary);
        return acc;
      }, {});
    }

    const data = rows.map((row) => mapSeatRow(row, eventMap[row.event_id] || null));

    res.json({
      data,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSeatById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await db('seats').where({ id }).first();
    if (!row) return res.status(404).json({ error: 'Seat not found' });

    let event = null;
    if (String(req.query.includeEvent).toLowerCase() === 'true') {
      const eventRow = await db('events')
        .leftJoin('venues', 'events.venue_id', 'venues.id')
        .where('events.id', row.event_id)
        .first();
      if (eventRow) {
        const seatSummary = await eventHelpers.buildSeatSummary([eventRow.id]);
        event = eventHelpers.mapEventRow(eventRow, seatSummary);
      }
    }

    res.json(mapSeatRow(row, event));
  } catch (error) {
    next(error);
  }
};

exports.createSeat = async (req, res, next) => {
  try {
    const payload = buildSeatPayload(req.body);
    if (!payload.event_id || !payload.section || !payload.row_label || !payload.seat_number) {
      const err = new Error('eventId, section, rowLabel, and seatNumber are required');
      err.status = 400;
      throw err;
    }

    const event = await db('events').where({ id: payload.event_id }).first();
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const [id] = await db('seats').insert(payload);
    const created = await db('seats').where({ id }).first();

    res.status(201).json(mapSeatRow(created));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.status = 409;
      error.message = 'Duplicate seat detected';
    }
    next(error);
  }
};

exports.updateSeat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('seats').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'Seat not found' });

    const updates = buildSeatPayload(req.body, existing);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    if (updates.event_id && updates.event_id !== existing.event_id) {
      const event = await db('events').where({ id: updates.event_id }).first();
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
    }

    await db('seats').where({ id }).update(updates);
    const updated = await db('seats').where({ id }).first();
    res.json(mapSeatRow(updated));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.status = 409;
      error.message = 'Duplicate seat detected';
    }
    next(error);
  }
};

exports.deleteSeat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db('seats').where({ id }).del();
    if (!deleted) return res.status(404).json({ error: 'Seat not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
