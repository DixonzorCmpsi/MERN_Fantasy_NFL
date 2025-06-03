import express from 'express';
import axios from 'axios';
import { addPlayerToTeam } from '../controller/playerController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/player/:name', async (req, res) => {
  const playerName = req.params.name;

  try {
    const searchUrl = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(playerName)}&limit=1`;
    const searchResponse = await axios.get(searchUrl);

    console.log('🔍 ESPN Search Items:', searchResponse.data.items);

    const player = searchResponse.data.items.find(item => item.type === 'athlete');
    if (!player) {
      return res.status(404).json({ message: 'Player not found in search results.' });
    }

    const playerId = player.id;
    const playerDetailsUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${playerId}`;
    const playerResponse = await axios.get(playerDetailsUrl);
    const playerData = playerResponse.data;

    // Defensive coding: some athletes might not have complete profile info
    const result = {
      name: playerData.fullName || playerName,
      position: playerData?.position?.name || 'Unknown',
      team: playerData?.team?.displayName || 'Free Agent',
      image: playerData?.headshot?.href || '',
      stats: playerData.stats || []
    };

    return res.json(result);
  } catch (error) {
    console.error('❌ Error fetching player data:', error.message);
    return res.status(500).json({ message: 'Server error while fetching player info.' });
  }
});

router.post('/team/add', verifyToken, addPlayerToTeam);

export default router;
