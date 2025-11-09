require('dotenv').config({ path: '.env' });

const {
  DB_HOST = 'mysql',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = 'password',
  DB_NAME = 'etsr_users'
} = process.env;

module.exports = {
  client: 'mysql2',
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
  pool: { min: 0, max: 10 },
  migrations: {
    tableName: 'catalog_knex_migrations',
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
    loadExtensions: ['.js'],
  },
};
