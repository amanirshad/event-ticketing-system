require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Catalog Service listening on port ${PORT}`);
});
