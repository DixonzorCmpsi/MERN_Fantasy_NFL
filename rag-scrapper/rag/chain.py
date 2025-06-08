# rag/chain.py  – RAG helper used by FastAPI service
# ---------------------------------------------------------
#  1. loads FAISS index + meta.json built by the crawler
#  2. embeds the query name with e5-small-v2
#  3. retrieves the nearest document
#  4. calls Hugging Face Inference API (Llama‑3‑8B‑Instruct)
#  5. returns structured JSON including head‑shot image URL
# ---------------------------------------------------------

import json, os, requests, faiss
from pathlib import Path
from sentence_transformers import SentenceTransformer

# ── paths --------------------------------------------------
INDEX_DIR = Path("data/db")
FAISS_PATH = INDEX_DIR / "faiss.index"
META_PATH  = INDEX_DIR / "meta.json"
from dotenv import load_dotenv
load_dotenv()   
                
# ── load index & metadata ---------------------------------
index = faiss.read_index(str(FAISS_PATH))
meta  = json.loads(META_PATH.read_text())

# ── embedding model (must match crawler) ------------------
embedder = SentenceTransformer("intfloat/e5-small-v2")

# ── Hugging Face inference settings -----------------------
HF_API_TOKEN = os.getenv("HF_API_TOKEN")  # set this in env / Vercel secrets
HF_MODEL     = "meta-llama/Meta-Llama-3-8B-Instruct"

def llama_via_hf(prompt: str) -> str:
    """Send prompt to HF Inference API and return generated text."""
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type":  "application/json",
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "temperature": 0,
            "max_new_tokens": 120,
        },
    }
    resp = requests.post(
        f"https://api-inference.huggingface.co/models/{HF_MODEL}",
        headers=headers,
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    # HF streams a list of dicts; grab the first generated_text
    return resp.json()[0]["generated_text"]

# ── public function --------------------------------------
async def query_player(name: str) -> dict | None:
    """
    Given a player name, return:
      { slug, name, position, team, image, stats:{games,receptions,yards,tds} }
    or None if similarity is too low.
    """
    # 1️⃣  Embed query and search FAISS
    qvec = embedder.encode(name, normalize_embeddings=True)
    D, I = index.search(qvec.reshape(1, -1), k=3)
    if D[0, 0] < 0.2:        # similarity threshold
        return None

    best = meta[I[0, 0]]
    context = best["text"][:4000]  # keep prompt under model limit

    # 2️⃣  Call Llama‑3 via HF to extract career totals
    system_prompt = (
        "You are a JSON‑only extractor. "
        "Return exactly this schema: "
        '{"games":int,"receptions":int,"yards":int,"tds":int}'
    )
    user_prompt = (
        f"CONTEXT:\n{context}\n\n"
        f"QUESTION: Provide only the career totals for {best['name']} "
        "in valid JSON."
    )
    raw_json = llama_via_hf(system_prompt + "\n" + user_prompt)
    stats = json.loads(raw_json)

    # 3️⃣  Assemble final payload
    return {
        "slug":     best["slug"],
        "name":     best["name"],
        "position": best["position"],
        "team":     best["team"],
        "image":    best["image"],   # head‑shot URL from crawler
        "stats":    stats,
    }
