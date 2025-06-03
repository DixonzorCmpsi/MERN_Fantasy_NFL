// frontend/pages/TeamPage.jsx
import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Card, CardContent, CardMedia
} from '@mui/material';
import axios from 'axios';
import Navbar from '../components/ui/Navbar.jsx';

function TeamPage() {
  const [playerName, setPlayerName] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/player/${encodeURIComponent(playerName)}`);
      setPlayerData(res.data);
      setMessage('');
    } catch (err) {
      setMessage('Player not found.');
      setPlayerData(null);
    }
  };

  const handleAddToTeam = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        'http://localhost:5000/api/team/add',
        { name: playerData.name, image: playerData.image, position: playerData.position, team: playerData.team },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Player added to team!');
    } catch (err) {
      setMessage('Could not add player.');
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Typography variant="h4" textAlign="center" gutterBottom>
          Build Your Team
        </Typography>

        <TextField
          fullWidth
          label="Enter player name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" fullWidth onClick={handleSearch}>
          Search Player
        </Button>

        {playerData && (
          <Card sx={{ mt: 3 }}>
            <CardMedia component="img" image={playerData.image} height="200" />
            <CardContent>
              <Typography variant="h6">{playerData.name}</Typography>
              <Typography variant="body2">Team: {playerData.team} | Position: {playerData.position}</Typography>
              <Button sx={{ mt: 2 }} variant="outlined" onClick={handleAddToTeam}>
                Add to Team
              </Button>
            </CardContent>
          </Card>
        )}

        {message && (
          <Typography sx={{ mt: 2 }} color="secondary">
            {message}
          </Typography>
        )}
      </Container>
    </>
  );
}

export default TeamPage;
