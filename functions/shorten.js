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
          Location: longUrl,
        },
      };
    }
  
    return {
      statusCode: 404,
      body: "URL not found",
    };
  };