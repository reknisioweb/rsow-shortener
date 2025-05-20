// filepath: c:\Users\Martin\Documents\rsow-shortener\functions\latest.js
const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');

exports.handler = async function(event, context) {
  try {
    const res = await fetch('https://www.reknisioweb.cz/feed?sectionId=126454');
    const xml = await res.text();

    const parsed = await parseStringPromise(xml);
    const firstItem = parsed.rss.channel[0].item[0];
    const link = firstItem.link[0];

    return {
      statusCode: 307,
      headers: {
        Location: link,
      },
      body: '',
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: 'Error fetching or parsing RSS feed.',
    };
  }
}