if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const shortid = require('shortid');

const rsowUri = process.env.RSOW_URI;
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
 * Handler function to shorten URLs.
 * @param {Object} event - The event object containing request details.
 * @returns {Object} - The response object with status code and headers.
 */
exports.handler = async (event) => {
  // Ensure the HTTP method is POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse the request body to get the original URL
  const { originalUrl } = JSON.parse(event.body);

  // Check if the original URL is provided
  if (!originalUrl) {
    return { statusCode: 400, body: 'Missing originalUrl parameter' };
  }

  try {
    // Connect to the database
    await connectToDatabase();

    // Generate a unique shortId for the URL
    const shortId = shortid.generate();
    const newUrl = new Url({ shortId, originalUrl });

    // Save the new URL document to the database
    await newUrl.save();

    // Return the shortId and originalUrl in the response
    return {
      statusCode: 201,
      body: JSON.stringify({ shortId, originalUrl }),
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
