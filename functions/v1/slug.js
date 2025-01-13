if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
}

let connection = null;

// Character sets for generating slugs
const firstCharSet = 'BcUb80qrR65y7jO1uxGLKAl4eWzYP3dZgXtJvfoIskp9mNn2CwMEDihFTVHaSQ';
const secondCharSet = 'm2CBDZ48YJIkndMEy03iNg-GT7Lph.QqXHaSsv6fRoFzjVlr9xctbeW1OuAUKPw5';
const lastCharSet = 'putmbQe3rhGMl0awAUVfS5X1ILR4ZOsgoyHKq8nvj6TY7JDC9NizkBxEPWF2dc';

// Define the schema for the counter model
const counterSchema = new mongoose.Schema({
  firstIndex: { type: Number, required: true },
  secondIndex: { type: Number, required: true },
  lastIndex: { type: Number, required: true },
});

// Create the Counter model if it doesn't already exist
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

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
 * Retrieves the current counters from the database.
 * If no counters are found, initializes them to 0.
 * @returns {Object} - The current counters.
 */
async function getCurrentCounters() {
  let counters = await Counter.findOne();
  if (!counters) {
    counters = new Counter({ firstIndex: 0, secondIndex: 0, lastIndex: 0 });
    await counters.save();
  }
  return counters;
}

/**
 * Updates the counters in the database.
 * @param {Object} counters - The counters to update.
 */
async function updateCounters(counters) {
  await Counter.updateOne({}, counters);
}

/**
 * Generates a URL slug as a string of 3 characters.
 * The string is constructed by taking one character from each of the sets.
 * The counters are incremented with each call to generate a new combination.
 * If the generated slug already exists, the counters are incremented and the process repeats.
 * @returns {string} - The constructed URL slug.
 */
async function generateSlug() {
  let slug;
  let isUnique = false;
  const counters = await getCurrentCounters();

  while (!isUnique) {
    // Construct the slug from the current counters
    slug = firstCharSet[counters.firstIndex] + secondCharSet[counters.secondIndex] + lastCharSet[counters.lastIndex];

    // Check if the slug already exists in the database
    const existingUrl = await Url.findOne({ shortId: slug });
    if (!existingUrl) {
      isUnique = true;
    } else {
      // Increment the lastIndex
      counters.lastIndex++;
      if (counters.lastIndex >= lastCharSet.length) {
        counters.lastIndex = 0;
        counters.secondIndex++;
        if (counters.secondIndex >= secondCharSet.length) {
          counters.secondIndex = 0;
          counters.firstIndex++;
          if (counters.firstIndex >= firstCharSet.length) {
            counters.firstIndex = 0; // Reset to start if all combinations are exhausted
          }
        }
      }
    }
  }

  // Update the counters in the database
  await updateCounters(counters);

  return slug;
}

/**
 * AWS Lambda handler function to shorten URLs.
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

    // Generate a unique slug
    const shortId = await generateSlug();
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
