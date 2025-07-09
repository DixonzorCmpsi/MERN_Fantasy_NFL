import { scrapeFootballDbPlayer } from '../utils/footballDbScraper.js';
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
  if (!name) return res.status(400).json({ message: 'Player name required' });

  try {
    const scraped = await scrapeFootballDbPlayer(name);

    let team = await Team.findOne({ user: userId });
    if (!team) team = new Team({ user: userId });

    if (team.players.length >= 16)
      return res.status(400).json({ message: 'Team is full (16)' });

    if (team.players.some(p => p.slug === scraped.slug))
      return res.status(409).json({ message: 'Player already on roster' });

    team.players.push(scraped);
    await team.save();
    res.json({ success: true, team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add player' });
  }
};