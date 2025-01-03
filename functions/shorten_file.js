const urls = {
  "ex1": "https://www.example.com",
  "ex2": "https://www.example.org",
  "ex3": "https://www.example.com/?pokus",
  "ex4": "https://www.example.com",
};

exports.handler = async (event) => {
  // Extrahujeme část cesty za lomítkem
  const path = event.path.replace("/.netlify/functions/shorten", "").replace("/", "");
  const longUrl = urls[path];

  if (longUrl) {
    return {
      statusCode: 301,
      headers: {
        Location: longUrl, // Přesměrování na cílovou URL
        "Cache-Control": "no-store", // Zabrání cacheování
      },
      body: null, // Tělo odpovědi není potřeba
    };
  }

  return {
    statusCode: 404,
    body: "URL not found",
  };
};
