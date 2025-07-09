# rag/chain.py  – super‑lean version
import json, faiss
from pathlib import Path
from sentence_transformers import SentenceTransformer

DIR   = Path("data/db")
index = faiss.read_index(str(DIR / "faiss.index"))
meta  = json.loads((DIR / "meta.json").read_text())

embedder = SentenceTransformer("intfloat/e5-small-v2")

def query_player(name: str) -> dict | None:
    qvec = embedder.encode(name, normalize_embeddings=True)
    D, I = index.search(qvec.reshape(1, -1), k=1)
    if D[0, 0] < 0.20:            # similarity gate
        return None
    return meta[I[0, 0]]
 