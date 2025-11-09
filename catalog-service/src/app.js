const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const eventsRouter = require('./routes/events');
const venuesRouter = require('./routes/venues');
const seatsRouter = require('./routes/seats');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'catalog-service', timestamp: new Date().toISOString() });
});

app.use('/v1/events', eventsRouter);
app.use('/v1/venues', venuesRouter);
app.use('/v1/seats', seatsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
