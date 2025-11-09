Order Service (Node.js + Express + Knex)
Generated: 2025-11-04T07:31:16.095621Z

This service implements Order APIs and uses PostgreSQL (database-per-service).
It expects Seating and Payment services to be available (you can mock them).

Prerequisites:
- Node 18+
- PostgreSQL database (or set DATABASE_URL env)
- npm install

Environment variables (example):
  PORT=3000
  DB_HOST=127.0.0.1
  DB_PORT=5432
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_NAME=orderdb
  SEATING_URL=http://localhost:4000
  PAYMENT_URL=http://localhost:5000

Run:
  npm install
  npx knex migrate:latest --knexfile knexfile.js
  node src/app.js

Seed:
  The seeds/data.sql file contains INSERT statements generated from your CSVs.
  You can run them manually against your database.

APIs:
  POST /v1/orders
    Headers: Idempotency-Key
    Body: { userId, eventId, seats: [ {seatId} ] }

  GET /v1/orders/:id
  DELETE /v1/orders/:id
  GET /v1/orders

Notes:
- Seating and Payment clients call external services; for local testing run simple mocks.
- Idempotency is enforced on POST /v1/orders via idempotency_keys table.

