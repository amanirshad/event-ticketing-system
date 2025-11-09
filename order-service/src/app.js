require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ordersRouter = require('./routes/orders');
const db = require('./db'); // ✅ load DB before app starts

// ✅ Create Express app FIRST
const app = express();
app.use(bodyParser.json());

// ✅ Test DB connection
db.raw('SELECT 1')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

// ✅ Register routes
app.use('/v1/orders', ordersRouter);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Order Service listening on ${PORT}`);
});
