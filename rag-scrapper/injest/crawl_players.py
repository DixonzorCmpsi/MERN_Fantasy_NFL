# ingest/crawl_players.py
# -----------------------------------------------------------
# Crawl ESPN roster pages, fetch every active NFL athlete,
# pull JSON: overview, stats (NEW API), bio, splits, gamelog,
# and build / append a FAISS index.  Resume‑safe.
#
#   python ingest/crawl_players.py           # resume
#   python ingest/crawl_players.py --reset   # wipe & fresh crawl
# -----------------------------------------------------------

from __future__ import annotations
import argparse, json, re, shutil, time
from pathlib import Path

import faiss, requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# ── CLI ----------------------------------------------------
cli = argparse.ArgumentParser()
cli.add_argument("--reset", action="store_true",
                 help="delete data/db before crawl")
opts = cli.parse_args()

# ── paths --------------------------------------------------
DATA  = Path("data/db"); DATA.mkdir(parents=True, exist_ok=True)
META  = DATA / "meta.json"
IDX   = DATA / "faiss.index"

if opts.reset and DATA.exists():
    print("🗑  wiping data/db…"); shutil.rmtree(DATA); DATA.mkdir()

# ── model / index -----------------------------------------
embedder = SentenceTransformer("intfloat/e5-small-v2")
DIM      = embedder.get_sentence_embedding_dimension()
index    = faiss.IndexFlatIP(DIM)

meta, seen = [], set()
if META.exists() and IDX.exists():
    meta  = json.loads(META.read_text())
    index = faiss.read_index(str(IDX))
    seen  = {m["slug"] for m in meta}
    print(f"▶️  Resuming with {len(seen)} stored players.")
else:
    print("🆕  Fresh crawl.")

texts: list[str] = []

# ── HTTP session ------------------------------------------
HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/124.0 Safari/537.36"),
    "Accept": "application/json, text/html",
    "Referer": "https://www.espn.com/nfl/",
}
sess = requests.Session(); sess.headers.update(HEADERS)
sess.mount("https://", requests.adapters.HTTPAdapter(max_retries=3))

# ── constants & helpers -----------------------------------
TEAM_IDS   = range(1, 33)
ROSTER_URL = "https://www.espn.com/nfl/team/roster/_/id/{tid}"
PROFILE    = ("https://sports.core.api.espn.com/v2/sports/football/"
              "leagues/nfl/athletes/{aid}?lang=en&region=us")
STATS_API  = ("https://site.web.api.espn.com/apis/common/v3/stats/nfl/player"
              "?region=us&lang=en&contentorigin=espn&id={aid}")
ID_RE      = re.compile(r"/id/(\d+)/")

def career_from_categories(js: dict) -> dict:
    out = {"games": 0, "receptions": 0, "yards": 0, "tds": 0}
    cats = js.get("categories", [])
    if not cats:
        return out
    # pick the first category that has gamesPlayed
    for cat in cats:
        stats = cat.get("stats", {})
        if "gamesPlayed" in stats:
            n = cat["name"].lower()
            if n == "receiving":
                out.update(
                    games=int(stats.get("gamesPlayed", 0)),
                    receptions=int(stats.get("receptions", 0)),
                    yards=int(stats.get("yards", 0)),
                    tds=int(stats.get("touchdowns", 0)),
                )
            else:  # passing or rushing
                out.update(
                    games=int(stats.get("gamesPlayed", 0)),
                    yards=int(stats.get("yards", 0)),
                    tds=int(stats.get("touchdowns", 0)),
                )
            break
    return out

def get_json(url: str) -> dict:
    r = sess.get(url, timeout=20)
    if r.status_code == 200 and r.headers.get("content-type","").startswith("application/json"):
        return r.json()
    return {}

# ── crawl --------------------------------------------------
for tid in TEAM_IDS:
    html = sess.get(ROSTER_URL.format(tid=tid), timeout=20).text
    soup = BeautifulSoup(html, "lxml")
    team_name = soup.select_one("h1.TeamHeader__Name")
    team_name = team_name.text if team_name else f"Team-{tid}"
    ids = {m.group(1) for m in ID_RE.finditer(html)}
    print(f"[{team_name}] {len(ids)} ids")

    for aid in tqdm(ids, leave=False):
        slug = f"espn-{aid}"
        if slug in seen:
            continue

        # 1️⃣ overview
        prof = get_json(PROFILE.format(aid=aid))
        if not prof:
            continue

        name = prof.get("fullName", slug)
        pos  = prof.get("position", {}).get("name", "")
        img  = prof.get("headshot", {}).get("href", "")
        txt  = prof.get("displayName", "") + " " + json.dumps(prof.get("info", {}))

        # 2️⃣ main stats API (career totals always here if they exist)
        stats_json = get_json(STATS_API.format(aid=aid))
        stats = career_from_categories(stats_json) if stats_json else {"note": "no-stats-yet"}

        # 3️⃣ optional panels (bio, splits, gamelog)
        panels = {}
        for link in prof.get("links", []):
            href = link["href"]; rels = link.get("rel", [])
            if "news" in rels:             # skip news
                continue
            if "bio" in rels:
                panels["bio"] = get_json(href + "&lang=en&region=us")
            elif "splits" in rels:
                panels["splits"] = get_json(href + "&lang=en&region=us")
            elif "gamelog" in rels:
                panels["gamelog"] = get_json(href + "&lang=en&region=us")
            time.sleep(0.15)

        # 4️⃣ save
        meta.append(dict(
            slug=slug,
            name=name,
            position=pos,
            team=team_name,
            image=img,
            text=txt,
            stats=stats,
            panels=panels
        ))
        texts.append(txt); seen.add(slug)
        time.sleep(0.12)  # base rate‑limit

# ── embed --------------------------------------------------
if texts:
    print(f"\n🔄  Embedding {len(texts)} new texts …")
    for i in tqdm(range(0, len(texts), 64), desc="embed"):
        vecs = embedder.encode(texts[i:i+64], normalize_embeddings=True)
        index.add(vecs)
else:
    print("✅  No new players to embed.")

# ── save ---------------------------------------------------
faiss.write_index(index, str(IDX))
META.write_text(json.dumps(meta, indent=2))
print(f"✔  Total players in index: {len(meta)}")
