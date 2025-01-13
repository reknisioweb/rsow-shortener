if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
}

let connection = null;

const firstCharSet = 'BcUb80qrR65y7jO1uxGLKAl4eWzYP3dZgXtJvfoIskp9mNn2CwMEDihFTVHaSQ';
const secondCharSet = 'm2CBDZ48YJIkndMEy03iNg-GT7Lph.QqXHaSsv6fRoFzjVlr9xctbeW1OuAUKPw5';
const lastCharSet = 'putmbQe3rhGMl0awAUVfS5X1ILR4ZOsgoyHKq8nvj6TY7JDC9NizkBxEPWF2dc';

// Define the schema for the index model
const indexSchema = new mongoose.Schema({
  firstIndex: { type: Number, required: true },
  secondIndex: { type: Number, required: true },
  lastIndex: { type: Number, required: true },
});

// Create the Index model if it doesn't already exist
const Index = mongoose.models.Index || mongoose.model('Index', indexSchema);

// Define the schema for the URL model
const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
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
      connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'rsow-shortener',
      });
    } catch (error) {
      console.error('Database connection error:', error);
      throw new Error('Database connection failed');
    }
  }
}

/**
 * Retrieves the current indices from the database.
 * If no indices are found, initializes them to 0.
 * @returns {Object} - The current indices.
 */
async function getCurrentIndices() {
  let indices = await Index.findOne();
  if (!indices) {
    indices = new Index({ firstIndex: 0, secondIndex: 0, lastIndex: 0 });
    await indices.save();
  }
  return indices;
}

/**
 * Updates the indices in the database.
 * @param {Object} indices - The indices to update.
 */
async function updateIndices(indices) {
  await Index.updateOne({}, indices);
}

/**
 * Generates a URL slug as a string of 3 characters.
 * The string is constructed by taking one character from each of the sets.
 * The indices are incremented with each call to generate a new combination.
 * @returns {string} - The constructed URL slug.
 */
async function generateSlug() {
  const indices = await getCurrentIndices();

  const slug = firstCharSet[indices.firstIndex] + secondCharSet[indices.secondIndex] + lastCharSet[indices.lastIndex];

  // Increment the lastIndex
  indices.lastIndex++;
  if (indices.lastIndex >= lastCharSet.length) {
    indices.lastIndex = 0;
    indices.secondIndex++;
    if (indices.secondIndex >= secondCharSet.length) {
      indices.secondIndex = 0;
      indices.firstIndex++;
      if (indices.firstIndex >= firstCharSet.length) {
        indices.firstIndex = 0; // Reset to start if all combinations are exhausted
      }
    }
  }

  await updateIndices(indices);

  return slug;
}

/**
 * Handler function to shorten URLs.
 * @param {Object} event - The event object containing request details.
 * @returns {Object} - The response object with status code and headers.
 */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { originalUrl } = JSON.parse(event.body);

  if (!originalUrl) {
    return { statusCode: 400, body: 'Missing originalUrl parameter' };
  }

  try {
    await connectToDatabase();

    const shortId = await generateSlug();
    const newUrl = new Url({ shortId, originalUrl });

    await newUrl.save();

    return {
      statusCode: 201,
      body: JSON.stringify({ shortId, originalUrl }),
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
