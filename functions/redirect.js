if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const couchbase = require("couchbase");

exports.handler = async (event) => {
  const { shortId } = event.queryStringParameters;

  if (!shortId) {
    return { statusCode: 400, body: "Short ID is required" };
  }

  const cluster = await couchbase.connect(process.env.COUCHBASE_URL, {
    username: process.env.COUCHBASE_USER,
    password: process.env.COUCHBASE_PASSWORD,
  });
  const bucket = cluster.bucket("url_shortener");
  const collection = bucket.defaultCollection();

  try {
    const doc = await collection.get(shortId);
    return {
      statusCode: 302,
      headers: { Location: doc.content.originalUrl },
    };
  } catch (error) {
    return { statusCode: 404, body: "URL not found" };
  }
};
