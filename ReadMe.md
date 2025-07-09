## Run Rag Scrapper
# 1. Start Llama 3 via Ollama
ollama serve                        # 
ollama run llama3:8b-instruct       # 
or just ollama run llama3

# 2. Crawl & build index (only when you need fresh data)
cd rag-scraper && source .venv/bin/activate
pip freeze > requirements.txt

python ingest/crawl_players.py

# 3. Start the RAG API
uvicorn app:app --port 9100 --reload   # tab 2

# 4. Start your Express backend
cd backend && npm run dev              # tab 3

# 5. Front‑end React as usual
cd frontend && npm start               # tab 4
