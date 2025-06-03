import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  IconButton, Menu, MenuItem
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Logo" style={{ height: 40, marginRight: 10 }} />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none' }}
          >
            Dee Fantasy
          </Typography>
        </Box>

        {/* Nav Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button component={Link} to="/team" color="inherit">Team</Button>
          <Button component={Link} to="/about" color="inherit">Tools</Button>
          <Button component={Link} to="/contact" color="inherit">Contact</Button>

          {user ? (
            <>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                <AccountCircleIcon />
                <Typography sx={{ ml: 1 }}>{user.name || 'Account'}</Typography>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" color="inherit">Login</Button>
              <Button component={Link} to="/signup" color="inherit">Signup</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
