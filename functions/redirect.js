if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
}

let connection = null;

const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
});

// Pokud ještě neexistuje model.Url, vytvoříme ho.
const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);

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

exports.handler = async (event) => {
  let shortId;

  // Extrahujeme shortId z event.path
  const match = event.path.match(/\/([^/]+)$/); // Hledá poslední část URL
  if (match && match[1]) {
    shortId = match[1];
  } else {
    return { statusCode: 400, body: 'Missing shortId parameter' };
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
