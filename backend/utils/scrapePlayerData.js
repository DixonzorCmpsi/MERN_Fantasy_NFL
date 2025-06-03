import puppeteer from 'puppeteer';

export const scrapePlayerData = async (playerName) => {
  const url = `https://www.statmuse.com/nfl/ask/${encodeURIComponent(playerName)}`;
  
  let browser;

  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the primary content
    await page.waitForSelector('img', { timeout: 5000 });
    await page.waitForSelector('h1', { timeout: 5000 });

    const data = await page.evaluate(() => {
      const image = document.querySelector('img')?.src || '';
      const name = document.querySelector('h1')?.textContent?.trim() || '';
      const summary =
        document.querySelector('p.answer__body')?.textContent?.trim() ||
        document.querySelector('p')?.textContent?.trim() ||
        'No summary available';

      return { image, name, summary };
    });

    return {
      name: data.name || playerName,
      image: data.image || '',
      summary: data.summary
    };

  } catch (error) {
    console.error('Puppeteer scrape error:', error);
    return {
      name: playerName,
      image: '',
      summary: 'Failed to fetch player data'
    };
  } finally {
    if (browser) await browser.close();
  }
};
