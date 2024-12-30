const urls = {
  "ex1": "https://www.example.com",
  "ex2": "https://www.example.org",
};

exports.handler = async (event) => {
  const short = event.queryStringParameters.short;
  const longUrl = urls[short];

  if (longUrl) {
    return {
      statusCode: 301,
      headers: {
        Location: longUrl, // Cílová URL
        "Cache-Control": "no-store", // Zajistí, že prohlížeč nebude uchovávat staré hodnoty
      },a
      body: null, // Tělo není potřeba pro přesměrování
    };
  }

  return {
    statusCode: 404,
    body: "URL not found",
  };
};
