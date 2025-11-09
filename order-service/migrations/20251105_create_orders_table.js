exports.up = async function (knex) {
  await knex.schema.createTable('orders', (t) => {
    t.increments('id').unsigned().primary();
    t.string('external_id').unique().notNullable();
    t.string('status').notNullable();
    t.decimal('subtotal', 12, 2).notNullable();
    t.decimal('tax', 12, 2).notNullable();
    t.decimal('total', 12, 2).notNullable();
    t.string('currency', 10).defaultTo('USD');
    t.integer('payment_id').unsigned().nullable();
    t.integer('user_id').unsigned().nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('order_line_items', (t) => {
    t.increments('id').unsigned().primary();
    t.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.string('seat_id').notNullable();
    t.string('seat_label');
    t.string('section');
    t.decimal('price', 12, 2).notNullable();
    t.integer('quantity').defaultTo(1);
  });

  await knex.schema.createTable('tickets', (t) => {
    t.increments('id').unsigned().primary();
    t.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.string('ticket_ref').notNullable().unique();
    t.string('seat_id').notNullable();
    t.string('seat_label');
    t.decimal('price', 12, 2).notNullable();
    t.string('status').notNullable();
    t.timestamp('issued_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('payments', (t) => {
    t.increments('id').unsigned().primary();
    t.integer('order_id').unsigned().nullable().references('id').inTable('orders').onDelete('CASCADE');
    t.decimal('amount', 12, 2).notNullable();
    t.string('status').notNullable();
    t.string('gateway_ref');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('idempotency_keys', (t) => {
    t.string('key').primary();
    t.json('request_body');
    t.string('status');
    t.integer('order_id').unsigned().nullable().references('id').inTable('orders').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('idempotency_keys');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('order_line_items');
  await knex.schema.dropTableIfExists('orders');
};
