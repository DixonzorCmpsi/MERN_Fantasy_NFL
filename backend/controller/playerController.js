import { scrapeStatMusePlayer } from '../utils/statmuseScraper.js';
import { Team } from '../models/team.js';

export const getPlayerInfo = async (req, res) => {
  const playerName = req.query.name;
  if (!playerName) {
    return res.status(400).json({ success: false, message: 'Player name required' });
  }

  const data = await scrapeStatMusePlayer(playerName);
  if (!data || !data.name) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }

  res.json({ success: true, data });
};


export const addPlayerToTeam = async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  try {
    const playerData = await scrapePlayerData(name);

    let team = await Team.findOne({ user: userId });

    if (!team) {
      team = new Team({ user: userId, players: [playerData] });
    } else {
      if (team.players.length >= 16) return res.status(400).json({ message: 'Team is full' });
      team.players.push(playerData);
    }

    await team.save();
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not add player' });
  }
};
