if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const couchbase = require("couchbase");

exports.handler = async (event) => {
  const { url } = JSON.parse(event.body);

  if (!url) {
    return { statusCode: 400, body: "URL is required" };
  }

  const cluster = await couchbase.connect(process.env.COUCHBASE_URL, {
    username: process.env.COUCHBASE_USER,
    password: process.env.COUCHBASE_PASSWORD,
  });
  const bucket = cluster.bucket("url_shortener");
  const collection = bucket.defaultCollection();

  const shortId = Math.random().toString(36).substring(2, 8);
  await collection.insert(shortId, { originalUrl: url });

  return {
    statusCode: 200,
    body: JSON.stringify({ shortUrl: `${process.env.BASE_URL}/${shortId}` }),
  };
};
