const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const donorRoutes = require('./routes/donors');
const ngoRoutes = require('./routes/ngos');
const donationRoutes = require('./routes/donations');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'manager',
    database: 'donor_ngo_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.use('/donors', donorRoutes(db));
app.use('/ngos', ngoRoutes(db));
app.use('/donations', donationRoutes(db));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
