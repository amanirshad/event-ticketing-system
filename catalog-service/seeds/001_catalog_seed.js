const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { slugify } = require('../src/utils/slugify');
const { normalizeEventStatus, normalizeSeatStatus } = require('../src/utils/normalizers');

const resolveDataDir = () => {
  const candidates = [
    process.env.CATALOG_SEED_DIR,
    path.resolve(__dirname, '../data'),
    path.resolve(__dirname, '../../etsr_seed dataset'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Seed data directory not found. Set CATALOG_SEED_DIR env or place CSVs in catalog-service/data');
};

const DATA_DIR = resolveDataDir();

const loadCsv = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  const contents = fs.readFileSync(filePath, 'utf8');
  return parse(contents, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
};

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

exports.seed = async function seed(knex) {
  const venuesCsv = loadCsv('etsr_venues.csv');
  const eventsCsv = loadCsv('etsr_events.csv');
  const seatsCsv = loadCsv('etsr_seats.csv');

  await knex.transaction(async (trx) => {
    await trx('seats').del();
    await trx('events').del();
    await trx('venues').del();

    const venueRecords = venuesCsv.map((row) => ({
      legacy_id: Number(row.venue_id),
      name: row.name,
      slug: `${slugify(row.name)}-${row.venue_id}`,
      city: row.city,
      state: row.state || null,
      capacity: row.capacity === undefined || row.capacity === '' ? null : Number(row.capacity),
      timezone: 'Asia/Kolkata',
      latitude: null,
      longitude: null,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    if (venueRecords.length) {
      for (const chunkRecords of chunk(venueRecords, 500)) {
        await trx('venues')
          .insert(chunkRecords)
          .onConflict('legacy_id')
          .merge();
      }
    }

    const venues = await trx('venues').select('id', 'legacy_id');
    const venueIdMap = venues.reduce((acc, venue) => {
      acc[Number(venue.legacy_id)] = venue.id;
      return acc;
    }, {});

    const eventRecords = eventsCsv
      .map((row) => {
        const legacyVenueId = Number(row.venue_id);
        const venueId = venueIdMap[legacyVenueId];
        if (!venueId) {
          return null;
        }

        const status = normalizeEventStatus(row.status) || 'SCHEDULED';

        return {
          legacy_id: Number(row.event_id),
          venue_id: venueId,
          title: row.title,
          slug: `${slugify(row.title)}-${row.event_id}`,
          event_type: row.event_type || 'GENERAL',
          status,
          event_date: new Date(row.event_date),
          base_price: row.base_price === undefined || row.base_price === '' ? null : Number(row.base_price),
          currency: 'INR',
          description: null,
          tags: null,
          is_published: status !== 'CANCELLED',
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
      .filter(Boolean);

    if (eventRecords.length) {
      for (const chunkRecords of chunk(eventRecords, 500)) {
        await trx('events')
          .insert(chunkRecords)
          .onConflict('legacy_id')
          .merge();
      }
    }

    const events = await trx('events').select('id', 'legacy_id');
    const eventIdMap = events.reduce((acc, event) => {
      acc[Number(event.legacy_id)] = event.id;
      return acc;
    }, {});

    const seenSeatKeys = new Set();

    const seatRecords = seatsCsv
      .map((row) => {
        const legacyEventId = Number(row.event_id);
        const eventId = eventIdMap[legacyEventId];
        if (!eventId) {
          return null;
        }

        const section = row.section || 'GENERAL';
        const rowLabel = row.row || 'NA';
        const seatNumber = row.seat_number ? String(row.seat_number) : 'NA';

        const compositeKey = `${eventId}:${section}:${rowLabel}:${seatNumber}`;
        if (seenSeatKeys.has(compositeKey)) {
          return null;
        }
        seenSeatKeys.add(compositeKey);

        return {
          legacy_id: Number(row.seat_id),
          event_id: eventId,
          section,
          row_label: rowLabel,
          seat_number: seatNumber,
          price: row.price === undefined || row.price === '' ? null : Number(row.price),
          status: normalizeSeatStatus(row.status),
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
      .filter(Boolean);

    if (seatRecords.length) {
      for (const chunkRecords of chunk(seatRecords, 1000)) {
        await trx('seats')
          .insert(chunkRecords)
          .onConflict('legacy_id')
          .merge();
      }
    }
  });
};
