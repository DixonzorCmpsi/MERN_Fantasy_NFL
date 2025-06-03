import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import Navbar from '../components/ui/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function HomePage() {
  const { user } = useAuth();
  console.log("user in navbar:", user);


  return (
    <>
      <Navbar />
      <Container maxWidth="md">
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {user ? `Welcome back, ${user.name}!` : 'Welcome to the Fantasy Football League App!'}
          </Typography>

          {user ? (
            <>
              {/* Example placeholder logic until we fetch team data */}
              <Typography variant="body1" sx={{ mt: 2 }}>
                {user.hasTeam
                  ? "Here's your starting lineup for this week..."
                  : "You haven’t created a team yet. Head over to the 'Team' tab to get started!"}
              </Typography>
            </>
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Please log in to access your fantasy football dashboard.
            </Typography>
          )}
        </Box>
      </Container>
    </>
  );
}

export default HomePage;
