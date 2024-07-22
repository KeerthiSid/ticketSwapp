const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import the cors package
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(bodyParser.json());
app.use(cors());  // Use the cors middleware

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eventName TEXT,
            eventDate TEXT,
            ticketPrice REAL,
            listingPrice REAL,
            minPrice REAL,
            transferable TEXT,
            sellerEmail TEXT,
            sellerPhone TEXT
        )
    `);
});

app.post('/api/tickets', (req, res) => {
    const { eventName, eventDate, ticketPrice, listingPrice, minPrice, transferable, sellerEmail, sellerPhone } = req.body;
    const stmt = db.prepare(`
        INSERT INTO tickets (eventName, eventDate, ticketPrice, listingPrice, minPrice, transferable, sellerEmail, sellerPhone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(eventName, eventDate, ticketPrice, listingPrice, minPrice, transferable, sellerEmail, sellerPhone, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID });
    });
    stmt.finalize();
});

app.get('/api/tickets', (req, res) => {
    db.all('SELECT * FROM tickets', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/tickets/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});

app.put('/api/tickets/:id', (req, res) => {
    const id = req.params.id;
    const { eventName, eventDate, ticketPrice, listingPrice, minPrice, transferable, sellerEmail, sellerPhone } = req.body;
    const stmt = db.prepare(`
        UPDATE tickets SET eventName = ?, eventDate = ?, ticketPrice = ?, listingPrice = ?, minPrice = ?, transferable = ?, sellerEmail = ?, sellerPhone = ? WHERE id = ?
    `);
    stmt.run(eventName, eventDate, ticketPrice, listingPrice, minPrice, transferable, sellerEmail, sellerPhone, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
    stmt.finalize();
});

app.delete('/api/tickets/:id', (req, res) => {
    const id = req.params.id;
    const stmt = db.prepare('DELETE FROM tickets WHERE id = ?');
    stmt.run(id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
    stmt.finalize();
});

module.exports = app;
