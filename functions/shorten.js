if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const shortid = require('shortid');

const rsowUri = process.env.RSOW_URI;
const mongoUri = process.env.MONGO_URI;
let connection = null;

const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
});

// Pokud ještě neexistuje model.Url, vytvoříme ho.
const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);

async function connectToDatabase() {
  if (!connection) {
    connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'rsow-shortener',
    });
  }
}

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

    const shortId = shortid.generate();
    const url = new Url({ shortId, originalUrl });
    await url.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ shortUrl: `${rsowUri}${shortId}` }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
