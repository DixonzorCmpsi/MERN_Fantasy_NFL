import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeStatMusePlayer = async (playerName) => {
  const formattedName = playerName.trim().replace(/\s+/g, '+');
  const searchUrl = `https://www.statmuse.com/nfl/ask/${formattedName}-stats`;

  try {
    const { data: html } = await axios.get(searchUrl);
    const $ = cheerio.load(html);

    const image = $('img.avatar').attr('src');
    const name = $('h1').first().text().trim();
    const summary = $('p.answer__body').first().text().trim();

    return {
      name: name || playerName,
      image: image || '',
      summary: summary || 'No summary found.',
    };
  } catch (err) {
    console.error('Scraping failed:', err.message);
    return null;
  }
};
