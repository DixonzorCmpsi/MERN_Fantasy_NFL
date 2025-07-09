import express from 'express';
import { scrapeFootballDbPlayer } from '../utils/footballDbScraper.js';
import { addPlayerToTeam } from '../controller/playerController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/** GET /api/player/:name  → Football‑DB scrape & return JSON */
router.get('/player/:name', async (req,res)=>{
  try {
    const { data: profile } = await axios.get(
      'http://rag-scraper:9100/profile',
      { params:{ player: req.params.name } }
    );
    // optional: get image if missing
    res.json(profile);
  } catch(err){
    res.status(err.response?.status || 500).json({ message: err.message });
  }
});

/** POST /api/team/add  → add scraped player to current user’s roster */
router.post('/team/add', verifyToken, addPlayerToTeam);

export default router;
