import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: String,
  image: String,
  summary: String,
  position: String,
  team: String,
});

const teamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  players: [playerSchema], // up to 16
});

export const Team = mongoose.model('Team', teamSchema);
