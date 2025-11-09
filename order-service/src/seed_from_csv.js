const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '../../data_csv_generated');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const outFile = path.join(dataDir, 'data.sql');
let sql = '-- Seed data generated from uploaded CSVs\n\n';
sql += fs.readFileSync(path.join(__dirname, '../seeds/data.sql'), 'utf-8');
fs.writeFileSync(outFile, sql, 'utf-8');
console.log('Wrote', outFile);
