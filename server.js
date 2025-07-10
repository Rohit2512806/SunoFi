const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use PORT environment variable on Render, fallback to 3000 locally

// MongoDB Connection URI
// Please ensure this URI is correct and your database name 'MusicData' is accurate.
const MONGODB_URI = 'mongodb+srv://rohitpatel2512806:74Rohit58@cluster0.1uu3aet.mongodb.net/MusicData?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Define Mongoose Schemas and Models ---
const songSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // 'id' field is required and should be unique
    title: { type: String, required: true }, // Title is required
    artist: { type: String, required: true }, // Artist is required
    album: String,    // Optional
    genre: String,    // Optional
    duration: String, // Optional
    url: { type: String, required: false }, // URL is not strictly required, can be null/empty
});

const artistSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true }, // Name is required and unique
    image: { type: String, required: false }, // Image URL is not strictly required
    genre: String,    // Optional
    bio: String,      // Optional
});

const Song = mongoose.model('Song', songSchema);
const Artist = mongoose.model('Artist', artistSchema);

// Middleware
app.use(cors()); // Enable CORS for requests from all origins
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' folder (if you use one)

// --- API Endpoints ---

/**
 * Handles GET requests to retrieve all songs and artists from MongoDB.
 * Returns a JSON object containing arrays of songs and artists.
 */
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

/**
 * Handles POST requests to add a new song to MongoDB.
 * Expects 'title', 'artist', and 'url' in the request body.
 * Generates a simple unique ID for the song.
 */
app.post('/api/add-song', async (req, res) => {
    try {
        const { title, artist, url, album, genre, duration } = req.body;

        if (!title || !artist || !url) {
            return res.status(400).json({ message: 'Title, artist, and URL are required.' });
        }

        const newSongData = {
            id: `song${Date.now()}`, // Generate a simple, unique ID
            title,
            artist,
            url,
            album: album || '', // Default to empty string if not provided
            genre: genre || '',
            duration: duration || ''
        };

        const newSong = new Song(newSongData);
        await newSong.save();
        res.status(201).json(newSong);
    } catch (error) {
        console.error('Error adding song to MongoDB:', error);
        if (error.code === 11000) { // Handle duplicate key error
            return res.status(409).json({ message: 'A song with this ID already exists.', error: error.message });
        }
        res.status(500).json({ message: 'Error adding song.', error: error.message });
    }
});

/**
 * Handles POST requests to add a new artist to MongoDB.
 * Expects 'name' and 'image' in the request body.
 * Checks if an artist with the same name already exists to prevent duplicates.
 */
app.post('/api/add-artist', async (req, res) => {
    try {
        const { name, image, genre, bio } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Artist name is required.' });
        }

        const newArtistData = {
            name,
            image: image || '',
            genre: genre || '',
            bio: bio || ''
        };

        const existingArtist = await Artist.findOne({ name: newArtistData.name });
        if (existingArtist) {
            return res.status(409).json({ message: 'Artist already exists.' });
        }

        const newArtist = new Artist(newArtistData);
        await newArtist.save();
        res.status(201).json(newArtist);
    } catch (error) {
        console.error('Error adding artist to MongoDB:', error);
        if (error.code === 11000) { // Handle duplicate key error
            return res.status(409).json({ message: 'An artist with this name already exists.', error: error.message });
        }
        res.status(500).json({ message: 'Error adding artist.', error: error.message });
    }
});

/**
 * Handles PUT requests to update an existing song by its ID.
 * Expects 'title', 'artist', and 'url' in the request body.
 * Updates only the fields provided in the request.
 */
app.put('/api/update-song/:id', async (req, res) => {
    try {
        const songId = req.params.id;
        const { title, artist, url } = req.body; // Destructure all expected fields from the request body

        // Create an object containing fields to update, only if they are present in the request
        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (artist !== undefined) updateFields.artist = artist;
        if (url !== undefined) updateFields.url = url; // This line ensures the URL is updated

        // Log the received data and the update operation for debugging
        console.log(`Updating song with ID: ${songId}`);
        console.log('Received data for update:', req.body);
        console.log('Fields to update:', updateFields);

        const updatedSong = await Song.findOneAndUpdate(
            { id: songId }, // Find the song by its 'id'
            { $set: updateFields }, // Set the fields provided in updateFields
            { new: true, runValidators: true } // 'new: true' returns the updated document, 'runValidators: true' runs schema validators
        );

        if (updatedSong) {
            console.log('Song updated successfully:', updatedSong);
            res.json(updatedSong); // Send back the updated song
        } else {
            console.warn(`Song with ID: ${songId} not found for update.`);
            res.status(404).json({ message: 'Song not found.' }); // 404 if song not found
        }
    } catch (error) {
        console.error('Error updating song in MongoDB:', error);
        res.status(500).json({ message: 'Error updating song.', error: error.message });
    }
});

/**
 * Handles PUT requests to update an existing artist by their name.
 * Expects 'name', 'image', 'genre', 'bio' in the request body.
 * Updates only the fields provided in the request.
 */
app.put('/api/update-artist/:name', async (req, res) => {
    try {
        const artistName = decodeURIComponent(req.params.name); // Decode URL-encoded name
        const { name, image, genre, bio } = req.body;

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (image !== undefined) updateFields.image = image;
        if (genre !== undefined) updateFields.genre = genre;
        if (bio !== undefined) updateFields.bio = bio;

        const updatedArtist = await Artist.findOneAndUpdate(
            { name: artistName },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

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

/**
 * Handles DELETE requests to remove a song by its ID from MongoDB.
 * Returns 204 No Content on successful deletion, or 404 if the song is not found.
 */
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

/**
 * Handles DELETE requests to remove an artist by their name from MongoDB.
 * Returns 204 No Content on successful deletion, or 404 if the artist is not found.
 */
app.delete('/api/delete-artist/:name', async (req, res) => {
    try {
        const artistName = decodeURIComponent(req.params.name); // Decode URL-encoded name
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

/**
 * Serves the admin HTML file.
 * Ensure 'admin.html' is in the same directory as 'server.js', or within a 'public' folder if `express.static` is configured for it.
 */
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

/**
 * Root endpoint for general access or a landing page.
 * Provides a simple welcome message.
 */
app.get('/', (req, res) => {
    res.send('Welcome to MyMedia API! Go to /admin for the admin panel.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin Panel available at http://localhost:${PORT}/admin`);
});