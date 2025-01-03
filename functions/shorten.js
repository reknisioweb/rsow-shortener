if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('FAUNA_SERVER:', process.env.FAUNA_SERVER);

const axios = require('axios');

exports.handler = async (event) => {
  const shortCode = event.path.replace("/", ""); // Extrahuje část cesty za lomítkem
  const faunaEndpoint = `https://db.fauna.com`; // Base URL pro HTTP API
  const collection = "urls"; // Název vaší kolekce

  try {
    // Odeslání GET požadavku na FaunaDB HTTP API
    const response = await axios.post(
      `${faunaEndpoint}/query`,
      {
        query: `
          LET shortUrl = SELECT * FROM ${collection} WHERE short_code = '${shortCode}'
          RETURN shortUrl
        `
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FAUNA_SECRET}`, // Klíč pro autorizaci
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;

    if (result && result.data && result.data.long_url) {
      return {
        statusCode: 301,
        headers: {
          Location: result.data.long_url, // Přesměrování na cílovou URL
        },
        body: null,
      };
    }

    return {
      statusCode: 404,
      body: "URL not found",
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      body: "Internal server error",
    };
  }
};
