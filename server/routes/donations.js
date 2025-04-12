const express = require('express');
const authenticateToken = require('../middleware/auth');

module.exports = (db) => {
    const router = express.Router();

    router.post('/create', authenticateToken, (req, res) => {
        if (req.user.role !== 'donor') {
            return res.status(403).send('Unauthorized');
        }
        const { ngo_id, amount } = req.body;
        const sql = 'INSERT INTO donations (donor_id, ngo_id, amount, donation_date) VALUES (?, ?, ?, NOW())';
        db.query(sql, [req.user.id, ngo_id, amount], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Donation created successfully' });
        });
    });

    router.get('/ngo', authenticateToken, (req, res) => {
        if (req.user.role !== 'ngo') {
            return res.status(403).send('Unauthorized');
        }
        const sql = `
            SELECT d.id, d.amount, d.donation_date, r.name as donor_name
            FROM donations d
            JOIN donors r ON d.donor_id = r.id
            WHERE d.ngo_id IN (SELECT id FROM ngos WHERE id = ?)
        `;
        db.query(sql, [req.user.id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    });

    return router;
};
