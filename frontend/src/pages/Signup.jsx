import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext'; // 👈 import context

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // 👈 grab login method from context

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      const { token, user } = res.data;

      login(token, user);        // 👈 store token + user in global state
      navigate('/home');         // 👈 redirect to homepage
    } catch (error) {
      const msg = error?.response?.data?.message || 'Something went wrong';
      setErrorMsg(msg);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <img src={logo} alt='Logo' style={{ height: 50 }} />
      </Box>

      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Sign Up</Typography>

        {errorMsg && (
          <Typography sx={{ mt: 2, color: 'red', textAlign: 'center' }}>
            {errorMsg}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            margin='normal'
            name='name'
            label='Name'
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin='normal'
            name='email'
            label='Email'
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin='normal'
            name='password'
            label='Password'
            type='password'
            value={formData.password}
            onChange={handleChange}
          />
          <Button type='submit' fullWidth variant='contained' sx={{ mt: 2 }}>
            Create Account
          </Button>

          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default Signup;
