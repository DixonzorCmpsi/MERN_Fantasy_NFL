## MERN Fantasy‑Football – README

> **Full‑stack stack**
> React (front‑end) + Express (API) + FastAPI (player lookup) + MongoDB
> Crawler pulls data from ESPN → builds a FAISS index → FastAPI serves it in < 5 ms.

---

### Table of Contents

1. [Project Layout](#project-layout)
2. [Prerequisites](#prerequisites)
3. [1 · Run the ESPN Web‑Scraper](#1--run-the-espn-web-scraper)
4. [2 · Start the Back‑end APIs](#2--start-the-back-end-apis)
5. [3 · Start the React Front‑end](#3--start-the-react-front-end)
6. [Environment Variables](#environment-variables)
7. [Common Dev Commands](#common-dev-commands)
8. [Deployment Tips](#deployment-tips)

---

## Project Layout

```
MERN Fantasy football/
│
├─ rag-scraper/                 # Python scraper + FastAPI service
│   ├─ ingest/
│   │   └─ crawl_players.py     # ESPN roster crawler  ⚡
│   ├─ data/db/                 # faiss.index  +  meta.json
│   ├─ requirements.txt
│   └─ app.py                   # FastAPI  (GET /profile?player=...)
│
├─ backend/                     # Express + Mongo
│   ├─ routes/
│   │   └─ player.js            # proxy → FastAPI  +  add‑to‑team
│   ├─ controller/
│   │   └─ playerController.js
│   ├─ models/
│   │   └─ team.model.js        # Mongoose schema (players max 16)
│   └─ server.js
│
├─ frontend/                    # React (MUI)
│   ├─ pages/TeamPage.jsx
│   └─ ...
└─ README.md                    # ← you are here
```

---

## Prerequisites

| Tool        | Version                |
| ----------- | ---------------------- |
| **Node.js** | ≥ 18                   |
| **Python**  | ≥ 3.9                  |
| **MongoDB** | local or cloud (Atlas) |

> **Mac / Linux:** use `python3` not `python` if needed.
> **Windows:** Git‑Bash or PowerShell works fine.

---

## 1 · Run the ESPN Web‑Scraper

1. **Activate venv**

   ```bash
   cd rag-scraper
   python -m venv .venv
   source .venv/bin/activate      # Windows: .\.venv\Scripts\activate
   ```

2. **Install deps**

   ```bash
   pip install -r requirements.txt
   ```

3. **First crawl (full rebuild)**

   ```bash
   python ingest/crawl_players.py --reset
   ```

   *Takes \~3 min; creates `data/db/faiss.index` (\~40 MB) & `meta.json`.*

4. **Incremental crawl (weekly)**

   ```bash
   python ingest/crawl_players.py
   ```

---

## 2 · Start the Back‑end APIs

| Service                     | Port   | Command                                |
| --------------------------- | ------ | -------------------------------------- |
| **FastAPI** (player lookup) | `9100` | `uvicorn app:app --port 9100 --reload` |
| **Express API**             | `5000` | `npm run dev` *(from `backend/`)*      |

> `GET http://localhost:5000/api/player/Patrick%20Mahomes`
> → Express proxy → FastAPI → career stats JSON.

---

## 3 · Start the React Front‑end

```bash
cd frontend
npm install        # first time
npm start          # dev server on http://localhost:3000
```

Open **Team Page** → search a player → add to roster (JWT required).

---

## Environment Variables

| Name          | Where                                         | Example                         |
| ------------- | --------------------------------------------- | ------------------------------- |
| `MONGO_URI`   | `backend/.env`                                | `mongodb://127.0.0.1:27017/ffb` |
| `JWT_SECRET`  | `backend/.env`                                | `supersecret123`                |
| `FASTAPI_URL` | *optional* if FastAPI not on `localhost:9100` | `https://api.myapp.com/profile` |

---

## Common Dev Commands

```bash
# Wipe & rebuild data
python ingest/crawl_players.py --reset

# Seed one test user (example)
node backend/scripts/seedUser.js

# ESLint + Prettier check
npm run lint
```

---

## Deployment Tips

* **FastAPI** can ship as a Docker side‑car or Railway service (45 MB model + index).
* **Express** + **React** can be combined in Vercel / Render; just point
  `FASTAPI_URL` to the public FastAPI endpoint.
* Re‑run the crawler weekly via GitHub Actions or a cron on the FastAPI box.

