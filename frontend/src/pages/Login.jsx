import React, { useState } from 'react';
import { TextField, Typography, Button, Box, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { login: storeAuthData } = useAuth(); // 👈 storeAuthData = login method from context

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { token, user } = res.data;

            // Store the user and token in context (AuthContext)
      storeAuthData(token, user);

      navigate('/home');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Something went wrong';
      setErrorMsg(msg);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Login</Typography>

        {errorMsg && (
          <Typography sx={{ mt: 2, color: 'red', textAlign: 'center' }}>
            {errorMsg}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Login
          </Button>
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default Login;
