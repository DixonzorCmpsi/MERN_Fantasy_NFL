\## Running the Web‑Scraper 🕸️⚡

> This section covers *only* the data‑collection step.
> By the end you’ll have `data/db/faiss.index` and `data/db/meta.json`
> filled with up‑to‑date ESPN player data that the rest of the stack can
> query in milliseconds.

---

### 1  Create / Activate the Python venv

```bash
# from the repo root
cd rag-scraper
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# mac / Linux
source .venv/bin/activate
```

You should see `(.venv)` at the start of your prompt.

---

### 2  Install crawler dependencies

```bash
pip install -r requirements.txt --upgrade
```

`requirements.txt` (already committed) contains:

```
beautifulsoup4
lxml
tqdm
requests
sentence-transformers
faiss-cpu
```

---

### 3  Run the crawler (first time)

```bash
python ingest/crawl_players.py --reset
```

* `--reset` wipes `data/db/` and does a **full rebuild**
  (≈ 2–4 minutes on a laptop).
* The script prints each NFL team, shows a progress bar, then embeds the
  text into FAISS.

Example output 👇

```
wiping data/db…
Fresh crawl.
[Philadelphia Eagles] 88 ids
[embed] 100%|██████████| 45/45 [01:29<00:00,  1.98s/it]
✔  Total players in index: 2841
```

---

### 4  Subsequent incremental crawls

```bash
python ingest/crawl_players.py
```

*No* `--reset` → the crawler **resumes**, adding any new players it
finds and skipping the rest. Finishes in seconds.

---

### 5  Where the data lives

| Path                  | Contents                                                                                |
| --------------------- | --------------------------------------------------------------------------------------- |
| `data/db/meta.json`   | One JSON object per player (name, team, head‑shot, career stats, plus raw ESPN panels). |
| `data/db/faiss.index` | Vector index used by FastAPI for instant name look‑ups.                                 |

Both files are committed to `.gitignore` by default, but small enough
(\~45 MB total) to ship with a container or serverless bundle if you
prefer.

---

### 6  Common commands

| Task                    | Command                                  |                                                       |
| ----------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Fresh rebuild           | `python ingest/crawl_players.py --reset` |                                                       |
| Weekly update (cron)    | `python ingest/crawl_players.py`         |                                                       |
| Inspect a single player | \`jq '.\[]                               | select(.name=="Patrick Mahomes")' data/db/meta.json\` |

---

Now your database is ready—start the FastAPI service (`uvicorn app:app --port 9100`) and the rest of the stack can serve player profiles with
no external calls.
