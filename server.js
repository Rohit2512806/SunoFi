const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // path module is still needed for serving static files

const app = express();
const PORT = 3000;

// MongoDB Connection URI
const MONGODB_URI = 'mongodb+srv://rohitpatel2512806:74Rohit58@cluster0.1uu3aet.mongodb.net/MusicData?retryWrites=true&w=majority&appName=Cluster0'; // Updated with your provided URL

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schemas and Models
const songSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    title: String,
    artist: String,
    album: String,
    genre: String,
    duration: String,
    // Add other fields as per your song structure
});

const artistSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    genre: String,
    bio: String,
    // Add other fields as per your artist structure
});

const Song = mongoose.model('Song', songSchema);
const Artist = mongoose.model('Artist', artistSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// --- API Endpoints ---

// GET all data (songs and artists)
app.get('/api/data', async (req, res) => {
    try {
        const songs = await Song.find();
        const artists = await Artist.find();
        res.json({ songs, artists });
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        res.status(500).json({ message: 'Error fetching data.' });
    }
});

// ADD a new song
app.post('/api/add-song', async (req, res) => {
    try {
        const newSongData = req.body;
        // Generate a simple ID if not provided, or use a more robust method
        newSongData.id = newSongData.id || `song${Date.now()}`;
        const newSong = new Song(newSongData);
        await newSong.save();
        res.status(201).json(newSong);
    } catch (error) {
        console.error('Error adding song to MongoDB:', error);
        res.status(500).json({ message: 'Error adding song.', error: error.message });
    }
});

// ADD a new artist
app.post('/api/add-artist', async (req, res) => {
    try {
        const newArtistData = req.body;
        // Check if artist already exists
        const existingArtist = await Artist.findOne({ name: newArtistData.name });
        if (existingArtist) {
            return res.status(409).json({ message: 'Artist already exists.' });
        }
        const newArtist = new Artist(newArtistData);
        await newArtist.save();
        res.status(201).json(newArtist);
    } catch (error) {
        console.error('Error adding artist to MongoDB:', error);
        res.status(500).json({ message: 'Error adding artist.', error: error.message });
    }
});

// UPDATE a song
app.put('/api/update-song/:id', async (req, res) => {
    try {
        const songId = req.params.id;
        const updatedSongData = req.body;
        const updatedSong = await Song.findOneAndUpdate({ id: songId }, updatedSongData, { new: true });
        if (updatedSong) {
            res.json(updatedSong);
        } else {
            res.status(404).json({ message: 'Song not found.' });
        }
    } catch (error) {
        console.error('Error updating song in MongoDB:', error);
        res.status(500).json({ message: 'Error updating song.', error: error.message });
    }
});

// UPDATE an artist
app.put('/api/update-artist/:name', async (req, res) => {
    try {
        const artistName = req.params.name;
        const updatedArtistData = req.body;
        const updatedArtist = await Artist.findOneAndUpdate({ name: artistName }, updatedArtistData, { new: true });
        if (updatedArtist) {
            res.json(updatedArtist);
        } else {
            res.status(404).json({ message: 'Artist not found.' });
        }
    } catch (error) {
        console.error('Error updating artist in MongoDB:', error);
        res.status(500).json({ message: 'Error updating artist.', error: error.message });
    }
});

// DELETE a song
app.delete('/api/delete-song/:id', async (req, res) => {
    try {
        const songId = req.params.id;
        const result = await Song.deleteOne({ id: songId });
        if (result.deletedCount > 0) {
            res.status(204).send(); // No Content
        } else {
            res.status(404).json({ message: 'Song not found.' });
        }
    } catch (error) {
        console.error('Error deleting song from MongoDB:', error);
        res.status(500).json({ message: 'Error deleting song.', error: error.message });
    }
});

// DELETE an artist
app.delete('/api/delete-artist/:name', async (req, res) => {
    try {
        const artistName = req.params.name;
        const result = await Artist.deleteOne({ name: artistName });
        if (result.deletedCount > 0) {
            res.status(204).send(); // No Content
        } else {
            res.status(404).json({ message: 'Artist not found.' });
        }
    } catch (error) {
        console.error('Error deleting artist from MongoDB:', error);
        res.status(500).json({ message: 'Error deleting artist.', error: error.message });
    }
});

// Serve the admin HTML file
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin Panel available at http://localhost:${PORT}/admin`);
});