const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (db) => {
    const router = express.Router();

    router.post('/register', async (req, res) => {
        const { username, password, email } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = 'INSERT INTO donors (username, password, email) VALUES (?, ?, ?)';
            db.query(sql, [username, hashedPassword, email], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Donor registered successfully' });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        const sql = 'SELECT * FROM donors WHERE username = ?';
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
            const token = jwt.sign({ id: user.id, role: 'donor' }, 'your_secret_key', { expiresIn: '1h' });
            res.json({ token });
        });
    });

    router.get('/profile', authenticateToken, (req, res) => {
        if (req.user.role !== 'donor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const sql = 'SELECT id, name FROM donors WHERE id = ?'; //changed the query
        db.query(sql, [req.user.id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Profile not found' });
            }
            const user = results[0];
            const token = jwt.sign({ id: user.id, role: 'donor' }, 'your_secret_key', {
                expiresIn: '1h',
            });
            res.json({ id: user.id, name: user.name, token }); //added user.id
        });
    });

    return router;
};
