import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema(
  {
    season: String,          // e.g. "2024", "Career"
    games: Number,
    receptions: Number,
    yards: Number,
    tds: Number,
    // feel free to throw in rushing, tackles, etc.
  },
  { _id: false }            // keeps it lean; no ObjectIds for sub‑stats
);

const playerSchema = new mongoose.Schema(
  {
    slug:   { type: String, required: true }, // "aj-brown-brownaj01"  ← dedupe key
    name:   String,
    image:  String,
    summary:String,
    position:String,
    team:   String,
    stats:  statsSchema,
    scrapedAt: { type: Date, default: Date.now } // for easy cache refresh
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  players: { type: [playerSchema], default: [], maxLength: 16 }
});

// Compound index so the same player can’t be added twice to ONE roster
teamSchema.index(
  { user: 1, 'players.slug': 1 },
  { unique: true, sparse: true }
);

export const Team = mongoose.model('Team', teamSchema);
