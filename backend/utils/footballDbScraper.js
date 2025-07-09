// utils/footballDbScraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import puppeteer from 'puppeteer';

const BASE  = 'https://www.footballdb.com';
const limit = pLimit(4);                     // throttle parallel fetches

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  Referer: BASE,
};

/* ── helper: try Axios, auto‑fallback to Puppeteer on 403 ─────────── */
const fetchHtml = async (url, referer = BASE) => {
  const res = await axios.get(url, {
    headers: { ...DEFAULT_HEADERS, Referer: referer },
    timeout: 10_000,
    validateStatus: s => true,
  });

  if (res.status !== 403) return res.data; // ✅ good

  // ↪ 403 → use real Chrome TLS fingerprint
  const browser = await puppeteer.launch({ headless: 'new' });
  const page    = await browser.newPage();
  await page.setUserAgent(DEFAULT_HEADERS['User-Agent']);
  await page.setExtraHTTPHeaders({
    'Accept-Language': DEFAULT_HEADERS['Accept-Language'],
    'Upgrade-Insecure-Requests': '1',
    Referer: referer,
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  const html = await page.content();
  await browser.close();
  return html;
};

/* ─────────────────── main export ─────────────────────────────────── */
export async function scrapeFootballDbPlayer(playerName) {
  const name     = playerName.trim();
  const lastName = name.split(' ').pop();
  const letter   = lastName[0].toUpperCase();

  /* 1️⃣  Iterate through paginated A‑Z index */
  let slug       = null;
  let pageNum    = 1;
  const MAX_PAGES = 40; // safety cap

  while (!slug && pageNum <= MAX_PAGES) {
    const indexUrl  = `${BASE}/players/index.html?letter=${letter}&page=${pageNum}`;
    const indexHtml = await fetchHtml(indexUrl);
    const $page     = cheerio.load(indexHtml);

    slug = $page('table a')
      .filter((_i, el) => {
        const txt        = $page(el).text().trim().toLowerCase();
        const normAnchor = txt.replace(/[.\s]/g, '');
        const normName   = name.toLowerCase().replace(/[.\s]/g, '');
        return normAnchor === normName;
      })
      .attr('href'); // e.g. "/players/aj-brown-brownaj01"

    // stop looping if no “Next” button present
    const hasNext = $page('.pagination a')
      .filter((_i, el) => $page(el).text().trim() === 'Next').length;
    if (slug || !hasNext) break;
    pageNum += 1;
  }

  /* 1b️⃣  Site‑search fallback */
  if (!slug) {
    const searchUrl  = `${BASE}/search?name=${encodeURIComponent(name)}`;
    const searchHtml = await fetchHtml(searchUrl);
    const $search    = cheerio.load(searchHtml);
    slug = $search('#search-results a')
      .filter((_i, el) => $search(el).attr('href')?.startsWith('/players/'))
      .first()
      .attr('href');
  }

  if (!slug) throw new Error('Player not found on Football-DB');

  /* 2️⃣  Profile page */
  const profileUrl  = `${BASE}${slug}`;
  const profileHtml = await limit(() => fetchHtml(profileUrl));
  const $           = cheerio.load(profileHtml);

  const fullName = $('h1').first().text().trim() || name;
  const image    = $('.bio-photo img').attr('src') || '';
  const posTeam  = $('.bio-info').text();          // "Wide Receiver | Philadelphia Eagles"
  const [position = '', team = ''] = posTeam.split('|').map(s => s.trim());

  const row = $('table.statistics tbody tr')
    .filter((_i, el) => $(el).find('td').first().text().includes('Career'))
    .first()
    .find('td')
    .map((_i, el) => $(el).text().trim())
    .get();

  const stats = {
    span:       row[0] ?? '',
    games:      +row[2] || 0,
    receptions: +row[4] || 0,
    yards:      +row[5] || 0,
    tds:        +row[6] || 0,
  };

  return {
    slug: slug.replace('/players/', ''),
    name: fullName,
    image,
    summary: '',
    position,
    team,
    stats,
    scrapedAt: new Date(),
  };
}
