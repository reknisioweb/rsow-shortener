const faunadb = require("faunadb");
const q = faunadb.query;

const client = new faunadb.Client({ secret: process.env.FAUNA_SERVER });

exports.handler = async (event) => {
  const shortCode = event.path.replace("/", ""); // Extrahujeme zkratku z cesty

  try {
    // Najdeme záznam podle short_code
    const result = await client.query(
      q.Get(q.Match(q.Index("short_codes"), shortCode))
    );

    return {
      statusCode: 301,
      headers: {
        Location: result.data.long_url, // Přesměrujeme na long_url
      },
      body: null,
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 404,
      body: "URL not found",
    };
  }
};
