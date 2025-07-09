const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // You can choose any available port

const DATA_FILE = path.join(__dirname, 'songs.json');

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files (like admin.html)

// Helper function to read data
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return { songs: [], artists: [] }; // Return default empty structure if file is missing or corrupted
    }
}

// Helper function to write data
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4), 'utf8');
    } catch (error) {
        console.error('Error writing data file:', error);
    }
}

// --- API Endpoints ---

// GET all data (songs and artists)
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data);
});

// ADD a new song
app.post('/api/add-song', (req, res) => {
    const newSong = req.body;
    const data = readData();
    newSong.id = `song${data.songs.length + 1}`; // Simple ID generation
    data.songs.push(newSong);
    writeData(data);
    res.status(201).json(newSong);
});

// ADD a new artist
app.post('/api/add-artist', (req, res) => {
    const newArtist = req.body;
    const data = readData();
    // Check if artist already exists to prevent duplicates
    if (!data.artists.some(artist => artist.name === newArtist.name)) {
        data.artists.push(newArtist);
        writeData(data);
        res.status(201).json(newArtist);
    } else {
        res.status(409).json({ message: 'Artist already exists.' });
    }
});

// UPDATE a song
app.put('/api/update-song/:id', (req, res) => {
    const songId = req.params.id;
    const updatedSong = req.body;
    const data = readData();
    const index = data.songs.findIndex(s => s.id === songId);
    if (index !== -1) {
        data.songs[index] = { ...data.songs[index], ...updatedSong, id: songId }; // Preserve ID
        writeData(data);
        res.json(data.songs[index]);
    } else {
        res.status(404).json({ message: 'Song not found.' });
    }
});

// UPDATE an artist
app.put('/api/update-artist/:name', (req, res) => {
    const artistName = req.params.name;
    const updatedArtist = req.body;
    const data = readData();
    const index = data.artists.findIndex(a => a.name === artistName);
    if (index !== -1) {
        data.artists[index] = { ...data.artists[index], ...updatedArtist, name: artistName }; // Preserve name
        writeData(data);
        res.json(data.artists[index]);
    } else {
        res.status(404).json({ message: 'Artist not found.' });
    }
});

// DELETE a song
app.delete('/api/delete-song/:id', (req, res) => {
    const songId = req.params.id;
    const data = readData();
    const initialLength = data.songs.length;
    data.songs = data.songs.filter(s => s.id !== songId);
    if (data.songs.length < initialLength) {
        writeData(data);
        res.status(204).send(); // No Content
    } else {
        res.status(404).json({ message: 'Song not found.' });
    }
});

// DELETE an artist (careful: this won't update songs using this artist)
app.delete('/api/delete-artist/:name', (req, res) => {
    const artistName = req.params.name;
    const data = readData();
    const initialLength = data.artists.length;
    data.artists = data.artists.filter(a => a.name !== artistName);
    if (data.artists.length < initialLength) {
        writeData(data);
        res.status(204).send(); // No Content
    } else {
        res.status(404).json({ message: 'Artist not found.' });
    }
});


// Serve the admin HTML file
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on https://sunofi.onrender.com:${PORT}`);
    console.log(`Admin Panel available at https://sunofi.onrender.com:${PORT}/admin`);
});