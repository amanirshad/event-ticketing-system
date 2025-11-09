const db = require('../db');
const { slugify } = require('../utils/slugify');
const { normalizeEventStatus } = require('../utils/normalizers');
const { helpers: eventHelpers } = require('./eventsController');

const mapVenueRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    legacyId: row.legacy_id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    state: row.state,
    capacity: row.capacity,
    timezone: row.timezone,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildVenuePayload = (body, existing = {}) => {
  const {
    legacyId,
    name,
    city,
    state,
    capacity,
    timezone,
    latitude,
    longitude,
  } = body;

  const payload = {};

  if (legacyId !== undefined) payload.legacy_id = legacyId;

  if (name !== undefined) {
    if (!name) {
      const err = new Error('name is required');
      err.status = 400;
      throw err;
    }
    payload.name = name;
    payload.slug = `${slugify(name)}-${legacyId || existing.legacy_id || existing.id || Date.now()}`;
  }

  if (city !== undefined) {
    if (!city) {
      const err = new Error('city is required');
      err.status = 400;
      throw err;
    }
    payload.city = city;
  }

  if (state !== undefined) payload.state = state;
  if (capacity !== undefined) payload.capacity = capacity ? Number(capacity) : null;
  if (timezone !== undefined) payload.timezone = timezone || null;
  if (latitude !== undefined) payload.latitude = latitude === null ? null : Number(latitude);
  if (longitude !== undefined) payload.longitude = longitude === null ? null : Number(longitude);

  return payload;
};

exports.listVenues = async (req, res, next) => {
  try {
    const { city, q, minCapacity, maxCapacity, includeEvents } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const baseQuery = db('venues');

    if (city) {
      baseQuery.whereILike('city', `%${city}%`);
    }

    if (q) {
      baseQuery.where((builder) => {
        builder.whereILike('name', `%${q}%`).orWhereILike('city', `%${q}%`);
      });
    }

    if (minCapacity) {
      baseQuery.where('capacity', '>=', Number(minCapacity));
    }

    if (maxCapacity) {
      baseQuery.where('capacity', '<=', Number(maxCapacity));
    }

    const total = Number((await baseQuery.clone().count({ total: '*' }).first())?.total || 0);

    const rows = await baseQuery.clone().orderBy('name').limit(limit).offset(offset);

    let eventsByVenue = {};
    if (String(includeEvents).toLowerCase() === 'true' && rows.length) {
      const venueIds = rows.map((venue) => venue.id);
      const events = await db('events').whereIn('venue_id', venueIds);
      const seatSummary = await eventHelpers.buildSeatSummary(events.map((event) => event.id));

      eventsByVenue = events.reduce((acc, event) => {
        const mapped = eventHelpers.mapEventRow(event, seatSummary);
        if (!acc[event.venue_id]) acc[event.venue_id] = [];
        acc[event.venue_id].push(mapped);
        return acc;
      }, {});
    }

    const data = rows.map((row) => ({
      ...mapVenueRow(row),
      events: eventsByVenue[row.id] || undefined,
    }));

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

exports.getVenueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await db('venues').where({ id }).first();
    if (!row) return res.status(404).json({ error: 'Venue not found' });

    const includeEvents = String(req.query.includeEvents).toLowerCase() === 'true';
    let events = undefined;
    if (includeEvents) {
      const eventRows = await db('events').where({ venue_id: id }).orderBy('event_date');
      const seatSummary = await eventHelpers.buildSeatSummary(eventRows.map((evt) => evt.id));
      events = eventRows.map((evt) => eventHelpers.mapEventRow(evt, seatSummary));
    }

    res.json({
      ...mapVenueRow(row),
      events,
    });
  } catch (error) {
    next(error);
  }
};

exports.createVenue = async (req, res, next) => {
  try {
    const payload = buildVenuePayload(req.body);
    if (!payload.name || !payload.city) {
      const err = new Error('name and city are required');
      err.status = 400;
      throw err;
    }

    const [id] = await db('venues').insert(payload);
    const created = await db('venues').where({ id }).first();

    res.status(201).json(mapVenueRow(created));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.status = 409;
      error.message = 'Duplicate venue detected';
    }
    next(error);
  }
};

exports.updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('venues').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'Venue not found' });

    const updates = buildVenuePayload(req.body, existing);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    await db('venues').where({ id }).update(updates);
    const updated = await db('venues').where({ id }).first();
    res.json(mapVenueRow(updated));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.status = 409;
      error.message = 'Duplicate venue detected';
    }
    next(error);
  }
};

exports.deleteVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db('venues').where({ id }).del();
    if (!deleted) return res.status(404).json({ error: 'Venue not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.listVenueEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const venue = await db('venues').where({ id }).first();
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    const { status, from, to } = req.query;

    const query = db('events').where({ venue_id: id });

    if (status) {
      const statuses = (Array.isArray(status) ? status : status.split(',')).map((s) => normalizeEventStatus(s)).filter(Boolean);
      if (statuses.length) {
        query.whereIn('status', statuses);
      }
    }

    if (from) {
      query.where('event_date', '>=', new Date(from));
    }

    if (to) {
      query.where('event_date', '<=', new Date(to));
    }

    const rows = await query.orderBy('event_date');
    const seatSummary = await eventHelpers.buildSeatSummary(rows.map((evt) => evt.id));
    res.json(rows.map((evt) => eventHelpers.mapEventRow(evt, seatSummary)));
  } catch (error) {
    next(error);
  }
};
