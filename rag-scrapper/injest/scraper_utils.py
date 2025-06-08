"""
Crawl FootballDB, print each fetched player, store image URLs,
and build a FAISS index under data/db/.

Run once (or on a cron) inside the rag‑scraper virtual environment:
    python ingest/crawl_players.py
"""

import json, re, time
from pathlib import Path

import cloudscraper, faiss
from bs4 import BeautifulSoup, FeatureNotFound
from sentence_transformers import SentenceTransformer

# ───────────────────────── config ──────────────────────────
INDEX_DIR = Path("data/db")          # data/db/faiss.index + meta.json
INDEX_DIR.mkdir(parents=True, exist_ok=True)

SLEEP = 0.25                         # politeness delay (s); lower if you dare
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0"

scraper = cloudscraper.create_scraper(delay=10, browser="chrome")
scraper.headers.update({"User-Agent": UA})

embedder = SentenceTransformer("intfloat/e5-small-v2")   # fast CPU model
DIM = embedder.get_sentence_embedding_dimension()
index = faiss.IndexFlatIP(DIM)

meta:  list = []   # each item: {slug,name,position,team,image,text}
texts: list = []   # raw text that will be embedded in one batch
seen:  set  = set()

# ───────────────────── soup helper ────────────────────────
def make_soup(html: str):
    """Try lxml parser first; fall back to built‑in html.parser."""
    try:
        return BeautifulSoup(html, "lxml")
    except FeatureNotFound:
        return BeautifulSoup(html, "html.parser")

# ───────────────── crawl a single player page ─────────────
def crawl_player(slug: str):
    if slug in seen:
        return
    seen.add(slug)

    url = f"https://www.footballdb.com{slug}"
    r   = scraper.get(url, timeout=20)
    if r.status_code != 200:
        print(f"  ! {slug} HTTP {r.status_code}")
        return

    soup = make_soup(r.text)
    name = soup.h1.text.strip() if soup.h1 else slug.split("/")[-1]

    bio = soup.select_one(".bio-info")
    pos, team = ("", "")
    if bio and "|" in bio.text:
        pos, team = map(str.strip, bio.text.split("|", 1))

    img   = soup.select_one(".bio-photo img")
    image = img["src"] if img else ""

    text  = soup.get_text(" ", strip=True)

    print(f"  ✓ {name}")
    meta.append(
        dict(slug=slug, name=name, position=pos, team=team, image=image, text=text)
    )
    texts.append(text)

# ───────────────── crawl A‑Z index pages ──────────────────
for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    page = 1
    while True:
        idx_url = (
            f"https://www.footballdb.com/players/index.html?letter={letter}"
            if page == 1
            else f"https://www.footballdb.com/players/index.html?letter={letter}&page={page}"
        )
        r = scraper.get(idx_url, timeout=20)
        soup = make_soup(r.text)
        links = soup.select("table a[href^='/players/']")

        if not links:
            break

        print(f"[{letter}-{page}] {len(links)} links")
        for a in links:
            crawl_player(a["href"])
            time.sleep(SLEEP)

        if not soup(text=re.compile(r"\bNext\b", re.I)):
            break
        page += 1

# ───────────────── batch embeddings & save ────────────────
print("\n🔄  Embedding texts …")
for i in range(0, len(texts), 64):
    vecs = embedder.encode(texts[i : i + 64], normalize_embeddings=True)
    index.add(vecs)

faiss.write_index(index, str(INDEX_DIR / "faiss.index"))
(INDEX_DIR / "meta.json").write_text(json.dumps(meta, indent=2))
print(f"✔  Saved {len(meta)} players to {INDEX_DIR}")
