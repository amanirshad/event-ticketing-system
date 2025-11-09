const db = require('../db');
const { slugify } = require('../utils/slugify');
const { normalizeEventStatus, normalizeSeatStatus } = require('../utils/normalizers');

const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

const mapEventRow = (row, seatStatsMap = {}) => {
  if (!row) return null;
  const stats = seatStatsMap[row.id] || null;
  return {
    id: row.id,
    legacyId: row.legacy_id,
    title: row.title,
    slug: row.slug,
    eventType: row.event_type,
    status: row.status,
    eventDate: row.event_date,
    basePrice: row.base_price !== undefined && row.base_price !== null ? Number(row.base_price) : null,
    currency: row.currency,
    description: row.description,
    tags: parseJson(row.tags) || [],
    isPublished: row.is_published === 1 || row.is_published === true,
    venue: row.venue_id
      ? {
          id: row.venue_id,
          name: row.venue_name,
          city: row.venue_city,
          state: row.venue_state,
        }
      : null,
    seatSummary: stats,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const applyEventFilters = (query, filters) => {
  const { city, type, status, q, isPublished } = filters;

  if (city) {
    query.whereILike('venues.city', `%${city}%`);
  }

  if (type) {
    query.whereILike('events.event_type', `%${type}%`);
  }

  if (status) {
    const desiredStatuses = Array.isArray(status) ? status : status.split(',');
    const normalized = desiredStatuses
      .map((value) => normalizeEventStatus(value))
      .filter(Boolean);
    if (normalized.length) {
      query.whereIn('events.status', normalized);
    }
  }

  if (isPublished !== undefined) {
    if (['true', 'false'].includes(String(isPublished).toLowerCase())) {
      query.where('events.is_published', String(isPublished).toLowerCase() === 'true');
    }
  }

  if (q) {
    query.where((builder) => {
      builder.whereILike('events.title', `%${q}%`).orWhereILike('venues.name', `%${q}%`);
    });
  }
};

const buildSeatSummary = async (eventIds) => {
  if (!eventIds.length) return {};
  const rows = await db('seats')
    .whereIn('event_id', eventIds)
    .groupBy('event_id')
    .select('event_id')
    .select(db.raw('COUNT(*) as total'))
    .select(db.raw("SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available"))
    .select(db.raw("SUM(CASE WHEN status = 'ON_HOLD' THEN 1 ELSE 0 END) as on_hold"))
    .select(db.raw("SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) as sold"));

  return rows.reduce((acc, row) => {
    acc[row.event_id] = {
      total: Number(row.total || 0),
      available: Number(row.available || 0),
      onHold: Number(row.on_hold || 0),
      sold: Number(row.sold || 0),
    };
    return acc;
  }, {});
};

exports.listEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, includeSeats } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const baseQuery = db('events')
      .leftJoin('venues', 'events.venue_id', 'venues.id');

    applyEventFilters(baseQuery, req.query);

    const countResult = await baseQuery.clone().clearSelect().clearOrder().count({ total: '*' }).first();
    const total = countResult ? Number(countResult.total || countResult['count(*)'] || 0) : 0;

    const rows = await baseQuery
      .clone()
      .select(
        'events.*',
        'venues.id as venue_id',
        'venues.legacy_id as venue_legacy_id',
        'venues.name as venue_name',
        'venues.city as venue_city',
        'venues.state as venue_state'
      )
      .orderBy('events.event_date', 'asc')
      .limit(pageSize)
      .offset(offset);

    let seatSummary = {};
    if (String(includeSeats).toLowerCase() === 'true') {
      const eventIds = rows.map((row) => row.id);
      seatSummary = await buildSeatSummary(eventIds);
    }

    const data = rows.map((row) => mapEventRow(row, seatSummary));

    res.json({
      data,
      meta: {
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await db('events')
      .leftJoin('venues', 'events.venue_id', 'venues.id')
      .select(
        'events.*',
        'venues.id as venue_id',
        'venues.legacy_id as venue_legacy_id',
        'venues.name as venue_name',
        'venues.city as venue_city',
        'venues.state as venue_state'
      )
      .where('events.id', id)
      .first();

    if (!row) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const seatSummary = await buildSeatSummary([row.id]);
    res.json(mapEventRow(row, seatSummary));
  } catch (error) {
    next(error);
  }
};

const buildEventPayload = (body) => {
  const {
    legacyId,
    venueId,
    title,
    eventType,
    status,
    eventDate,
    basePrice,
    currency,
    description,
    tags,
    isPublished = true,
  } = body;

  if (!title) {
    const err = new Error('title is required');
    err.status = 400;
    throw err;
  }

  if (!eventDate) {
    const err = new Error('eventDate is required');
    err.status = 400;
    throw err;
  }

  if (basePrice === undefined || basePrice === null) {
    const err = new Error('basePrice is required');
    err.status = 400;
    throw err;
  }

  if (!venueId) {
    const err = new Error('venueId is required');
    err.status = 400;
    throw err;
  }

  const normalizedStatus = status ? normalizeEventStatus(status) : 'SCHEDULED';
  if (status && !normalizedStatus) {
    const err = new Error('Invalid status value');
    err.status = 400;
    throw err;
  }

  const parsedTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
    ? tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    legacy_id: legacyId || null,
    venue_id: Number(venueId),
    title,
    slug: `${slugify(title)}-${legacyId || Date.now()}`,
    event_type: eventType || 'GENERAL',
    status: normalizedStatus,
    event_date: new Date(eventDate),
    base_price: Number(basePrice),
    currency: currency || 'INR',
    description: description || null,
    tags: parsedTags.length ? JSON.stringify(parsedTags) : null,
    is_published: Boolean(isPublished),
  };
};

const buildSeatRows = (eventId, seats = []) => {
  if (!Array.isArray(seats) || seats.length === 0) return [];

  return seats.map((seat) => ({
    event_id: eventId,
    legacy_id: seat.legacyId || null,
    section: seat.section || 'GENERAL',
    row_label: seat.rowLabel || seat.row || 'NA',
    seat_number: seat.seatNumber ? String(seat.seatNumber) : 'NA',
    price: seat.price !== undefined && seat.price !== null ? Number(seat.price) : null,
    status: normalizeSeatStatus(seat.status),
    metadata: seat.metadata ? JSON.stringify(seat.metadata) : null,
  }));
};

exports.createEvent = async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const eventPayload = buildEventPayload(req.body);

    const venueExists = await trx('venues').where({ id: eventPayload.venue_id }).first();
    if (!venueExists) {
      const err = new Error('Venue not found');
      err.status = 404;
      throw err;
    }

    const [eventId] = await trx('events').insert(eventPayload);

    const seatsPayload = buildSeatRows(eventId, req.body.seats);
    if (seatsPayload.length) {
      await trx('seats').insert(seatsPayload);
    }

    await trx.commit();

    const created = await db('events')
      .leftJoin('venues', 'events.venue_id', 'venues.id')
      .select(
        'events.*',
        'venues.id as venue_id',
        'venues.legacy_id as venue_legacy_id',
        'venues.name as venue_name',
        'venues.city as venue_city',
        'venues.state as venue_state'
      )
      .where('events.id', eventId)
      .first();

    const seatSummary = await buildSeatSummary([eventId]);
    res.status(201).json(mapEventRow(created, seatSummary));
  } catch (error) {
    await trx.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      error.status = 409;
      error.message = 'Duplicate event detected';
    }
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const existing = await trx('events').where({ id }).first();
    if (!existing) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const updates = {};
    const {
      title,
      eventType,
      status,
      eventDate,
      basePrice,
      currency,
      description,
      tags,
      isPublished,
      venueId,
    } = req.body;

    if (title !== undefined) {
      updates.title = title;
      updates.slug = `${slugify(title)}-${existing.legacy_id || existing.id}`;
    }

    if (eventType !== undefined) {
      updates.event_type = eventType;
    }

    if (status !== undefined) {
      const normalizedStatus = normalizeEventStatus(status);
      if (!normalizedStatus) {
        const err = new Error('Invalid status value');
        err.status = 400;
        throw err;
      }
      updates.status = normalizedStatus;
    }

    if (eventDate !== undefined) {
      updates.event_date = new Date(eventDate);
    }

    if (basePrice !== undefined) {
      updates.base_price = Number(basePrice);
    }

    if (currency !== undefined) {
      updates.currency = currency;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (tags !== undefined) {
      const parsedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      updates.tags = parsedTags.length ? JSON.stringify(parsedTags) : null;
    }

    if (isPublished !== undefined) {
      updates.is_published = Boolean(isPublished);
    }

    if (venueId !== undefined) {
      const venueExists = await trx('venues').where({ id: Number(venueId) }).first();
      if (!venueExists) {
        const err = new Error('Venue not found');
        err.status = 404;
        throw err;
      }
      updates.venue_id = Number(venueId);
    }

    if (Object.keys(updates).length === 0) {
      await trx.rollback();
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    await trx('events').where({ id }).update(updates);

    await trx.commit();

    const updated = await db('events')
      .leftJoin('venues', 'events.venue_id', 'venues.id')
      .select(
        'events.*',
        'venues.id as venue_id',
        'venues.legacy_id as venue_legacy_id',
        'venues.name as venue_name',
        'venues.city as venue_city',
        'venues.state as venue_state'
      )
      .where('events.id', id)
      .first();

    const seatSummary = await buildSeatSummary([Number(id)]);
    res.json(mapEventRow(updated, seatSummary));
  } catch (error) {
    await trx.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      error.status = 409;
      error.message = 'Duplicate event detected';
    }
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db('events').where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.helpers = {
  mapEventRow,
  buildSeatSummary,
};
