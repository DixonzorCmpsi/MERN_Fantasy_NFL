from fastapi import FastAPI, Query, HTTPException
from rag.chain import query_player
import asyncio

app = FastAPI()

@app.get("/profile")
async def profile(player: str = Query(...)):
    data = await query_player(player)
    if not data:
        raise HTTPException(404, "player-not-found")
    return data
