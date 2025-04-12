const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (db) => {
    const router = express.Router();
    const authenticateToken = require('../middleware/auth');

    router.post('/register', async (req, res) => {
        const { name, username, password, location, people_count } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = 'INSERT INTO ngos (name, username, password, location, people_count) VALUES (?, ?, ?, ?, ?)';
            db.query(sql, [name, username, hashedPassword, location, people_count], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'NGO registered successfully' });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        const sql = 'SELECT * FROM ngos WHERE username = ?';
        db.query(sql, [username], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const token = jwt.sign({ id: user.id, role: 'ngo' }, 'your_secret_key', { expiresIn: '1h' });
            res.json({ token });
        });
    });

    router.get('/profile', authenticateToken, (req, res) => {
        if (req.user.role !== 'ngo') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const sql = 'SELECT name, location, people_count FROM ngos WHERE id = ?';
        db.query(sql, [req.user.id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Profile not found' });
            }
            res.json(results[0]);
        });
    });

    router.get('/search', authenticateToken, (req, res) => {
        const { location, people_count_min, people_count_max } = req.query;
        let sql = 'SELECT id, name, location, people_count FROM ngos WHERE 1=1';
        const params = [];

        // Filter by location if provided
        if (location) {
            sql += ' AND location LIKE ?';
            params.push(`%${location}%`);
        }

        // Filter by minimum people count if provided
        if (people_count_min) {
            sql += ' AND people_count >= ?';
            params.push(people_count_min);
        }

        // Filter by maximum people count if provided
        if (people_count_max) {
            sql += ' AND people_count <= ?';
            params.push(people_count_max);
        }

        db.query(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    });

    // Get unique NGO locations
    router.get('/locations', (req, res) => {
        const sql = 'SELECT DISTINCT location FROM ngos';
        db.query(sql, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // results = [ { location: 'Delhi' }, { location: 'Mumbai' }, ... ]
            const locations = results.map(row => row.location);
            res.json(locations);
        });
    });

    router.get('/profile/:ngoId', authenticateToken, (req, res) => {
        const ngoId = req.params.ngoId;
        if (req.user.role !== 'donor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const sql = 'SELECT name, location FROM ngos WHERE id = ?';
        db.query(sql, [ngoId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'NGO not found' });
            }
            res.json(results[0]);
        });
    });

    return router;
};