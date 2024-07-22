const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.json());
app.use(cors());  // Use the cors middleware

// Set up SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'tickets.db')); // Use file-based database

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

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Route to create a new ticket
app.post('/api/tickets', (req, res) => {
    const {
        eventName,
        eventDate,
        ticketPrice,
        listingPrice,
        minPrice,
        transferable,
        sellerEmail,
        sellerPhone
    } = req.body;

    const stmt = db.prepare(`
        INSERT INTO tickets (
            eventName,
            eventDate,
            ticketPrice,
            listingPrice,
            minPrice,
            transferable,
            sellerEmail,
            sellerPhone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        eventName,
        eventDate,
        ticketPrice,
        listingPrice,
        minPrice,
        transferable,
        sellerEmail,
        sellerPhone,
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );

    stmt.finalize();
});

// Route to get all tickets
app.get('/api/tickets', (req, res) => {
    db.all('SELECT * FROM tickets', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Route to get a single ticket by ID
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

// Route to update a ticket by ID
app.put('/api/tickets/:id', (req, res) => {
    const id = req.params.id;
    const {
        eventName,
        eventDate,
        ticketPrice,
        listingPrice,
        minPrice,
        transferable,
        sellerEmail,
        sellerPhone
    } = req.body;

    const stmt = db.prepare(`
        UPDATE tickets SET
            eventName = ?,
            eventDate = ?,
            ticketPrice = ?,
            listingPrice = ?,
            minPrice = ?,
            transferable = ?,
            sellerEmail = ?,
            sellerPhone = ?
        WHERE id = ?
    `);

    stmt.run(
        eventName,
        eventDate,
        ticketPrice,
        listingPrice,
        minPrice,
        transferable,
        sellerEmail,
        sellerPhone,
        id,
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );

    stmt.finalize();
});

// Route to delete a ticket by ID
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

// Handle the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
