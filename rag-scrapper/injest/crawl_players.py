# ingest/crawl_players.py  –  ESPN roster HTML + open JSON profile
# ----------------------------------------------------------------
# Usage:
#   python ingest/crawl_players.py           # resume
#   python ingest/crawl_players.py --reset   # wipe data/db first
# ----------------------------------------------------------------
from __future__ import annotations
import argparse, json, re, shutil, time
from pathlib import Path

import faiss, requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# ── CLI ----------------------------------------------------
arg = argparse.ArgumentParser()
arg.add_argument("--reset", action="store_true", help="wipe data/db first")
opts = arg.parse_args()

# ── paths --------------------------------------------------
DB = Path("data/db"); DB.mkdir(parents=True, exist_ok=True)
META = DB / "meta.json"; IDX = DB / "faiss.index"
if opts.reset and DB.exists():
    print("🗑  wiping data/db…"); shutil.rmtree(DB); DB.mkdir()

# ── model / index -----------------------------------------
embedder = SentenceTransformer("intfloat/e5-small-v2")
DIM = embedder.get_sentence_embedding_dimension()
index = faiss.IndexFlatIP(DIM)

meta, seen = [], set()
if META.exists() and IDX.exists():
    meta  = json.loads(META.read_text())
    index = faiss.read_index(str(IDX))
    seen  = {m["slug"] for m in meta}
    print(f"▶️  Resuming with {len(seen)} players.")
else:
    print("🆕  Fresh crawl.")

texts: list[str] = []

# ── HTTP session ------------------------------------------
HEAD = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/124.0 Safari/537.36"),
}
sess = requests.Session(); sess.headers.update(HEAD)

# ── helpers ------------------------------------------------
TEAM_IDS = list(range(1, 33))             # 1‑32
ROSTER_URL = "https://www.espn.com/nfl/team/roster/_/id/{tid}"
PROFILE_URL = ("https://sports.core.api.espn.com/v2/sports/football/"
               "leagues/nfl/athletes/{aid}?lang=en&region=us")

STAT_RE = re.compile(r"/splits/")         # quick check for stats link
ID_RE   = re.compile(r"/id/(\d+)/")       # athleteId extractor

def career_totals(js: dict) -> dict:
    out = {"games":0,"receptions":0,"yards":0,"tds":0}
    for split in js.get("splits", []):
        if split.get("type")!="career": continue
        cat = split["categories"][0]; st=cat["stats"]; n=cat["name"].lower()
        if n=="receiving":
            out.update(games=int(st.get("gamesPlayed",0)),
                       receptions=int(st.get("receptions",0)),
                       yards=int(st.get("yards",0)),
                       tds=int(st.get("touchdowns",0)))
        else:   # passing / rushing
            out.update(games=int(st.get("gamesPlayed",0)),
                       yards=int(st.get("yards",0)),
                       tds=int(st.get("touchdowns",0)))
        break
    return out

# ── crawl --------------------------------------------------
for tid in TEAM_IDS:
    r = sess.get(ROSTER_URL.format(tid=tid), timeout=20)
    if r.status_code != 200:
        print(f"[team {tid}] roster HTTP {r.status_code} – skipped"); continue

    soup = BeautifulSoup(r.text, "lxml")
    team_name = soup.select_one("h1.TeamHeader__Name").text if soup.select_one("h1.TeamHeader__Name") else f"Team-{tid}"
    ids = {m.group(1) for m in ID_RE.finditer(r.text)}
    print(f"[{team_name}] {len(ids)} ids")

    for aid in tqdm(ids, leave=False):
        slug = f"espn-{aid}"
        if slug in seen: continue

        prof = sess.get(PROFILE_URL.format(aid=aid), timeout=20)
        if prof.status_code != 200 or prof.headers.get("content-type","").startswith("text/html"):
            print(f"     ⚠️  profile {aid} HTTP {prof.status_code}")
            continue
        js = prof.json()

        name = js.get("fullName", slug)
        pos  = js.get("position",{}).get("name","")
        img  = js.get("headshot",{}).get("href","")
        txt  = js.get("displayName","") + " " + json.dumps(js.get("info",{}))

        stats = career_totals(js.get("stats", {}))

        meta.append(dict(slug=slug,name=name,position=pos,team=team_name,
                         image=img,text=txt,stats=stats))
        texts.append(txt); seen.add(slug)
        time.sleep(0.12)          # ESPN rate‑limit

# ── embed --------------------------------------------------
if texts:
    print(f"\n🔄  Embedding {len(texts)} new texts …")
    for i in tqdm(range(0,len(texts),64),desc="embed"):
        vecs = embedder.encode(texts[i:i+64], normalize_embeddings=True)
        index.add(vecs)
else:
    print("✅  No new players to embed.")

# ── save ---------------------------------------------------
faiss.write_index(index, str(IDX))
META.write_text(json.dumps(meta, indent=2))
print(f"✔  Total players in index: {len(meta)}")
