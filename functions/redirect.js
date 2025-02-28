// Load environment variables from a .env file if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');

// Get the MongoDB URI from environment variables
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
}

let connection = null;

// Define the schema for the URL model
const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true }, // Unique identifier for the shortened URL
  originalUrl: { type: String, required: true }, // The original URL to redirect to
});

// Create the URL model if it doesn't already exist
const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);

/**
 * Connects to the MongoDB database if not already connected.
 * @throws Will throw an error if the database connection fails.
 */
async function connectToDatabase() {
  if (!connection) {
    try {
      // Connect to the MongoDB database
      connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'rsow-shortener', // Specify the database name
      });
    } catch (error) {
      console.error('Database connection error:', error);
      throw new Error('Database connection failed');
    }
  }
}

/**
 * Handler function to redirect short URLs to their original URLs.
 * @param {Object} event - The event object containing request details.
 * @returns {Object} - The response object with status code and headers.
 */
exports.handler = async (event) => {
  let shortId;

  // Extract shortId from event.path
  const match = event.path.match(/\/([^/]+)$/); // Matches the last part of the URL
  if (match && match[1]) {
    shortId = match[1];
  } else {
    return { statusCode: 400, body: 'Missing shortId parameter' };
  }

  // Check if shortId is 2 or 3 digits
  if (/^\d{2,3}\/?$/.test(shortId)) {
    return {
      statusCode: 301,
      headers: { Location: `https://reknisioweb.cz/p/${shortId}` },
    };
  }

  try {
    await connectToDatabase();

    const url = await Url.findOne({ shortId });

    if (!url) {
      return { statusCode: 404, body: 'URL not found' };
    }

    return {
      statusCode: 301,
      headers: { Location: url.originalUrl },
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
