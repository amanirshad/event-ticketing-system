exports.up = async function (knex) {
  await knex.schema.createTable('venues', (table) => {
    table.increments('id').primary();
    table.integer('legacy_id').unsigned().unique();
    table.string('name').notNullable();
    table.string('slug').unique();
    table.string('city').notNullable();
    table.string('state');
    table.integer('capacity').unsigned();
    table.string('timezone').defaultTo('Asia/Kolkata');
    table.decimal('latitude', 10, 6);
    table.decimal('longitude', 10, 6);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.integer('legacy_id').unsigned().unique();
    table
      .integer('venue_id')
      .unsigned()
      .references('id')
      .inTable('venues')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('title').notNullable();
    table.string('slug').unique();
    table.string('event_type').notNullable();
    table
      .enum('status', ['ON_SALE', 'SOLD_OUT', 'CANCELLED', 'SCHEDULED'])
      .defaultTo('SCHEDULED');
    table.timestamp('event_date').notNullable();
    table.decimal('base_price', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('INR');
    table.text('description');
    table.json('tags');
    table.boolean('is_published').defaultTo(true);
    table.timestamps(true, true);

    table.index(['venue_id', 'event_type']);
    table.index(['status']);
    table.index(['event_date']);
  });

  await knex.schema.createTable('seats', (table) => {
    table.increments('id').primary();
    table.integer('legacy_id').unsigned().unique();
    table
      .integer('event_id')
      .unsigned()
      .references('id')
      .inTable('events')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('section').notNullable();
    table.string('row_label').notNullable();
    table.string('seat_number').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.enu('status', ['AVAILABLE', 'ON_HOLD', 'SOLD']).defaultTo('AVAILABLE');
    table.json('metadata');
    table.timestamps(true, true);

    table.unique(['event_id', 'section', 'row_label', 'seat_number']);
    table.index(['event_id', 'status']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('seats');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('venues');
};
